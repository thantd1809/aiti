from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, Text
from app.models.base import CommonTable


class ChatHistory(CommonTable):
    """
    This class represents the chat history table in the database.
    """
    __tablename__ = "chat_histories"

    user_id = Column(String(36), nullable=False)
    talk_title = Column(String(100), nullable=False)


class ChatHistoryDetail(CommonTable):
    """
    This class represents the chat history details table in the database.
    """
    __tablename__ = "chat_history_details"

    chat_histories_id = Column(String(36), nullable=False)
    talk_at = Column(DateTime, nullable=False)
    question_content = Column(String(), nullable=False)
    answer_content = Column(String(), nullable=False)
    talk_evaluation = Column(SmallInteger)
    reference_file = Column(Text, nullable=True)
