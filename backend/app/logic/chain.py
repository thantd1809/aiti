"""
The logic for the chatbot chain from OpenAI.
Chain: question + chat history + docs -> answer.
"""
from typing import Any, List, AsyncIterator, Optional, Sequence
from operator import itemgetter
import asyncio


from langchain_core.outputs import ChatResult
from langchain_openai import ChatOpenAI
from langchain_community.embeddings.openai import OpenAIEmbeddings
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    PromptTemplate)
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.retrievers import BaseRetriever
from langchain_core.runnables import (
    Runnable,
    RunnableBranch,
    RunnableLambda,
    RunnableMap)
from langchain_community.vectorstores.pgvector import PGVector
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.callbacks.manager import AsyncCallbackManagerForLLMRun
from langchain_core.outputs.chat_generation import ChatGeneration, ChatGenerationChunk

from app.schemas.chat import ChatRequest, ChatStreamLogRequest
from app.core.constants import REPHRASE_TEMPLATE
from app.utils.chain import get_response_template
from app.core.config import settings

detect_language_runnable = RunnableLambda(
    lambda x: llm.invoke([
        HumanMessage(content=f"What language is this sentence written in? Reply with the full name of the language in its native script only. No explanation.\n\n{x['question']}")
    ]).content.strip()
)


def get_embeddings_model() -> Embeddings:
    """
    Returns the embeddings model to be used for the retriever.
    """
    return OpenAIEmbeddings(chunk_size=200)


def get_retriever(user_id: str = None, file_ids: Optional[List[str]] = None) -> BaseRetriever:
    """
    Returns the retriever to be used in the chain.

    Args:
        user_id: Optional user ID to filter documents by permission
        file_ids: Optional list of file IDs to filter documents by

    Returns:
        A retriever that filters by user_id if provided
    """
    vector_store = PGVector(
        collection_name=settings.COLLECTION_NAME,
        connection_string=settings.DATABASE_URL,
        embedding_function=get_embeddings_model(),
    )

    base_retriever = vector_store.as_retriever(search_kwargs=dict(k=4))

    # If user_id is provided, filter documents by user_id
    if user_id is not None:
        # Create a filtered retriever that only returns documents uploaded by this user
        class UserFilteredRetriever(BaseRetriever):
            """Retriever that filters by user_id"""

            def _filter_docs(self, docs):
                accessible_file_ids = set(file_ids or [])

                filtered = []
                for doc in docs:
                    file_id = doc.metadata.get("file_id")
                    if file_id in accessible_file_ids:
                        filtered.append(doc)
                return filtered
            
            def _get_relevant_documents(self, query: str, *, run_manager=None, **kwargs):
                docs = base_retriever._get_relevant_documents(query, run_manager=run_manager, **kwargs)
                return self._filter_docs(docs)

            async def _aget_relevant_documents(self, query: str, *, run_manager=None, **kwargs):
                docs = await base_retriever._aget_relevant_documents(query, run_manager=run_manager, **kwargs)
                return self._filter_docs(docs)

        return UserFilteredRetriever()

    return base_retriever


def create_retriever_chain(
    llm: BaseLanguageModel, retriever: BaseRetriever
) -> Runnable:
    """
    Creates a chain that retrieves documents based on the question and chat history.
    """
    CONDENSE_QUESTION_PROMPT = PromptTemplate.from_template(REPHRASE_TEMPLATE)
    condense_question_chain = (
        CONDENSE_QUESTION_PROMPT | llm | StrOutputParser()
    ).with_config(
        run_name="CondenseQuestion",
    )
    conversation_chain = condense_question_chain | retriever
    return RunnableBranch(
        (
            RunnableLambda(lambda x: bool(x.get("chat_history"))).with_config(
                run_name="HasChatHistoryCheck"
            ),
            conversation_chain.with_config(
                run_name="RetrievalChainWithHistory"),
        ),
        (
            RunnableLambda(itemgetter("question")).with_config(
                run_name="Itemgetter:question"
            )
            | retriever
        ).with_config(run_name="RetrievalChainWithNoHistory"),
    ).with_config(run_name="RouteDependingOnChatHistory")


def format_docs(docs: Sequence[Document]) -> str:
    """
    Formats the retrieved documents into a string.
    """
    formatted_docs = []
    for i, doc in enumerate(docs):
        doc_string = f"<doc id='{i}'>{doc.page_content}</doc>"
        formatted_docs.append(doc_string)
    return "\n".join(formatted_docs)


def serialize_history(request: ChatStreamLogRequest):
    """
    Serializes the chat history into a list of messages.
    """
    chat_history = request["chat_history"] or []
    converted_chat_history = []
    for message in chat_history:
        if message.get("human") is not None:
            converted_chat_history.append(
                HumanMessage(content=message["human"]))
        if message.get("ai") is not None:
            converted_chat_history.append(AIMessage(content=message["ai"]))
    return converted_chat_history


def get_language_detection_runnable(llm: BaseLanguageModel) -> Runnable:
    """
    Returns a Runnable that detects the language code (ISO 639-1) of the question using the LLM.
    """
    return RunnableLambda(
        lambda x: llm.invoke([
            HumanMessage(content=f"What is the ISO 639-1 language code for the following sentence? Reply with the code only. No explanation.\n\n{x['question']}")
        ]).content.strip().lower()
    )


def create_chain(
    llm: BaseLanguageModel,
    retriever: BaseRetriever,
) -> Runnable:
    """
    Creates the chain for the chatbot, automatically detecting the language.
    """
    language_detector = get_language_detection_runnable(llm)

    retriever_chain = create_retriever_chain(
        llm,
        retriever,
    ).with_config(run_name="FindDocs")
    _context = RunnableMap(
        {
            "context": retriever_chain | format_docs,
            "question": itemgetter("question"),
            "chat_history": itemgetter("chat_history"),
        }
    ).with_config(run_name="RetrieveDocs")

    strOutput = StrOutputParser()

    def prompt_with_detected_language(inputs):
        language_code = inputs["language"]
        # Use the detected language code to generate a dynamic prompt
        response_template = get_response_template(language_code)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", response_template),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}"),
            ]
        )
        return prompt.format_prompt(
            chat_history=inputs["chat_history"],
            question=inputs["question"],
            context=inputs["context"]
        ).to_messages()

    response_synthesizer = (
        RunnableLambda(prompt_with_detected_language)
        | llm
        | strOutput
    ).with_config(run_name="GenerateResponse")

    return (
        {
            "question": RunnableLambda(itemgetter("question")).with_config(
                run_name="Itemgetter:question"
            ),
            "chat_history": RunnableLambda(serialize_history).with_config(
                run_name="SerializeHistory"
            ),
        }
        | RunnableMap(
            {
                "question": itemgetter("question"),
                "chat_history": itemgetter("chat_history"),
                "context": _context | itemgetter("context"),
                "language": language_detector,
            }
        )
        | response_synthesizer
    )


# Check if we have a valid OpenAI API key

# Try to create the ChatOpenAI instance, or use a MockChatModel if API key is not valid
try:
    # Create the base LLM
    llm = ChatOpenAI(
        model="gpt-4.1",
        streaming=True,
        temperature=0,
    )
except Exception as e:

    # Create a mock chat model for testing
    class MockChatModel(BaseChatModel):
        """Mock chat model that returns predefined responses for testing."""

        @property
        def _llm_type(self) -> str:
            return "mock-chat-model"

        def _generate(self, *args, **kwargs):
            raise NotImplementedError("MockChatModel is async only")

        async def _agenerate(
            self, messages: List[Any], stop: Optional[List[str]] = None,
            run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
            **kwargs: Any
        ) -> Any:
            from langchain_core.messages import AIMessage
            return ChatResult(generations=[ChatGeneration(message=AIMessage(content="This is a mock response for testing. The API is working correctly, but you need a valid OpenAI API key to get real responses."))])

        async def _astream_chat_generations(
            self, messages: List[Any], stop: Optional[List[str]] = None,
            run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
            **kwargs: Any
        ) -> AsyncIterator[ChatGenerationChunk]:
            text = "This is a mock streamed response for testing. The API is working correctly, but you need a valid OpenAI API key to get real responses."
            for char in text:
                if run_manager:
                    await run_manager.on_llm_new_token(char)
                yield ChatGenerationChunk(message_chunk={"content": char})
                await asyncio.sleep(0.01)  # Simulate streaming delay

    # Use the mock model
    llm = MockChatModel()


def get_chain_for_user(user_id: str = None, file_ids: Optional[List[str]] = None) -> Runnable:
    """
    Returns a new chain instance configured for the specific user.

    Args:
        user_id: The ID of the user making the request
        file_ids: Optional list of file IDs to filter documents by
        language: The language code for the response (default: Vietnamese)

    Returns:
        A chatbot chain that only accesses documents the user is allowed to see
    """
    # Get a retriever that filters by user ID if provided
    user_retriever = get_retriever(user_id, file_ids=file_ids)

    # Create a new chain using this user-specific retriever and language
    return create_chain(
        llm,
        user_retriever,
    )
