from app.core.constants import NUMBER_CHARACTERS_SUMMARIZE

def get_summarize_title_template(context="{context}"):
    """Returns the template for summarizing titles."""
    return "" \
    """Write a concise summary in {number_characters} characters of the following:
"{context}"
Remember: Your response must be in the same language as the context.
""".format(number_characters=NUMBER_CHARACTERS_SUMMARIZE, context=context)

# Template for response in different languages
def get_response_template(language_code="vi", context="{context}"):
    """
    Dynamically generate a response template that instructs the LLM to answer in the detected language.
    """
    return """
You are an expert in answering questions.
Your answers must be in the same language as the user's question (language code: {language_code}).

Use only the information inside the <context> block to answer the question.
If the answer can be found in one or more parts of the context, combine the relevant information and respond clearly.
If the context does not provide the answer, politely say so in the same language.

Guidelines:
- Do not fabricate information outside the context.
- You may summarize or combine related information across multiple documents.
- Use bullet points if it improves clarity.
- Keep the response natural and helpful, not too rigid.
- Always oriented that is the question.

<context>
    {context}
</context>

Remember:
- Always answer in the same language as the user's question (language code: {language_code}).
- If the context has relevant details (from one or more documents), use them to form the answer.
- Always oriented that is the question.
- If the context is empty or irrelevant, politely state that the answer is not found in the provided documents.
- Do not display documents in any context.
""".format(language_code=language_code, context=context)
