"""
Chat logic module
"""
from datetime import datetime
from dateutil.relativedelta import relativedelta

from langchain_community.chat_models import ChatOpenAI
from langchain_core.documents import Document
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.schemas.chat import ChatHistoryRequest, DeleteChatHistoryRequest, UpdateFeedbackRequest
from app.models.chat import ChatHistory, ChatHistoryDetail
from app.services.chat import ChatCRUD
from app.utils.response import OutputResponse
from app.core.constants import DATE_FORMAT, NUMBER_BYTE_SUMMARIZE
from app.utils.chain import get_summarize_title_template
from app.core.message import I0001, I0002, I0003


class ChatLogic:
    """
    Chat logic class
    """

    def __init__(self, db):
        self.chat_crud = ChatCRUD(db)

    def summarize_title(self, text):
        """
        Summarize title in 50 characters
        """
        template_string = get_summarize_title_template() 
        prompt = PromptTemplate(template=template_string, input_variables=["context"])

        llm = ChatOpenAI(temperature=0, model_name="gpt-4.1")
        chain = create_stuff_documents_chain(llm, prompt)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000, chunk_overlap=200)

        texts = text_splitter.split_text(text)
        docs = [Document(page_content=t) for t in texts]

        summarized_title = chain.invoke({"context": docs})

        if len(summarized_title.encode('utf-8')) > NUMBER_BYTE_SUMMARIZE:
            return summarized_title[:NUMBER_BYTE_SUMMARIZE] + "..."
        else:
            return summarized_title

    def create(self, request: ChatHistoryRequest, login_user_id: str) -> OutputResponse:
        """
        Create chat history
        """
        try:
            # Accessing data from the request
            login_user_id = login_user_id
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            if request.detail:
                if request.detail.chat_id:
                    # add chat detail from second time
                    chat_history_detail_model = ChatHistoryDetail(
                        chat_histories_id=request.detail.chat_id,
                        talk_at=current_date_time,
                        question_content=request.detail.question,
                        answer_content=request.detail.answer,
                        reference_file=request.detail.ref_file,
                        created_at=current_date_time,
                        created_by=login_user_id)
                    self.chat_crud.create(chat_history_detail_model)
                else:
                    # add chat and detail chat for first time
                    chat_history_model = ChatHistory(
                        user_id=login_user_id,
                        talk_title=self.summarize_title(request.talk_title),
                        created_at=current_date_time,
                        created_by=login_user_id)
                    self.chat_crud.create(chat_history_model)
                    if chat_history_model.id is not None:
                        chat_history_detail_model = ChatHistoryDetail(
                            chat_histories_id=chat_history_model.id,
                            talk_at=current_date_time,
                            question_content=request.detail.question,
                            answer_content=request.detail.answer,
                            reference_file=request.detail.ref_file,
                            created_at=current_date_time,
                            created_by=login_user_id)
                        self.chat_crud.create(chat_history_detail_model)
                        return OutputResponse.success(
                            code="I0001",
                            msg=I0001,
                            data={"chat_id": chat_history_model.id})
            # I0001
            return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete(self, request: DeleteChatHistoryRequest, user_id: str) -> OutputResponse:
        """
        Delete chat history
        """
        try:
            # Accessing data from the request
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.chat_crud.delete(request.chat_ids,
                                  current_date_time,
                                  user_id)
            # I0003
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete_chat(self, user_id: str):
        """
        Delete batch chat history
        """
        try:
            # Accessing data from the request
            current_date_time = datetime.now()
            one_year_ago = (
                datetime.now() - relativedelta(years=+1))
            three_years_ago = (
                datetime.now() - relativedelta(years=+3))
            # From over 3 years ago
            get_list_hard_delete = self.chat_crud.get_list_hard_delete(
                three_years_ago)
            # From under 3 years ago to 1 year ago
            get_list_soft_delete = self.chat_crud.get_list_soft_delete(
                one_year_ago, three_years_ago)
            list_ids_hard_delete = []
            list_ids_soft_delete = []
            for item in get_list_hard_delete:
                list_ids_hard_delete.append(item.id)

            for item in get_list_soft_delete:
                list_ids_soft_delete.append(item.id)

            self.chat_crud.delete_chat(
                list_ids_hard_delete,
                list_ids_soft_delete,
                current_date_time.strftime(DATE_FORMAT),
                user_id)
            # # I0003
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get(self, chat_id: str, user_id: str):
        """
        Get chat history detail
        """
        try:
            # Accessing data from the request
            list_chat_history_detail = self.chat_crud.get_by_chat_id(chat_id, user_id)
            if not list_chat_history_detail:
                return OutputResponse.error(msg="Chat history not found", status_code=404)
            chat_history_details = [
                {
                    "chat_detail_id": item.id,
                    "question": item.question_content,
                    "answer": item.answer_content,
                    "talk_evaluation": item.talk_evaluation,
                    "ref_file": item.reference_file
                }
                for item in list_chat_history_detail
            ]
            # I0003
            return OutputResponse.success(data=chat_history_details)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get_all(self, login_user_id: str, search: str, page: int, limit: int):
        """
        Get all chat history by user
        """
        try:
            # Process the data as needed
            list_chat_history, total = self.chat_crud.get_all(login_user_id, search, page, limit)
            chat_histories = [
                {
                    "chat_id": item.id,
                    "talk_title": item.talk_title,
                    "create_at": item.created_at
                }
                for item in list_chat_history
            ]
            return OutputResponse.success_with_pagination(data=chat_histories, page=page, limit=limit, total=total)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def update_talk_evaluation(self, request: UpdateFeedbackRequest, login_user_id: str):
        """
        Update talk evaluation
        """
        try:
            # Process the data as needed
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.chat_crud.update_talk_evaluation(
                request.feedback_id,
                request.score,
                current_date_time,
                login_user_id)
            # I0002
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
