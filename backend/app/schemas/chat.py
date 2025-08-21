from typing import Optional, List, Dict, Union, Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """
    The request body for the chat endpoint.
    """
    question: str
    chat_history: Optional[List[Dict[str, str]]]


class ChatStreamLogRequest(BaseModel):
    """
    The request body for the chat/stream_log endpoint.
    """
    input: Dict[str, Any] = {
        "question": "",
        "chat_history": []
    }
    config: Optional[Dict[str, Any]] = {"metadata": {}}
    include_names: Optional[List[str]] = []
    include_types: Optional[List[str]] = []
    include_tags: Optional[List[str]] = []
    exclude_names: Optional[List[str]] = []
    exclude_types: Optional[List[str]] = []
    exclude_tags: Optional[List[str]] = []
    file_ids: Optional[List[str]] = []
    folder_ids: Optional[List[str]] = []
    kwargs: Optional[Dict[str, Any]] = {}

    class Config:
        schema_extra = {
            "example": {
                "input": {
                    "question": "Hello, how are you?",
                    "chat_history": [
                        {"human": "Hi", "ai": "Hello! How can I assist you today?"}
                    ]
                },
                "config": {"metadata": {}},
                "file_ids": [1, 2],
                "language": "vi"
            }
        }


class ChatHistoryDetailRequest(BaseModel):
    """
    The request body for the chat-history-detail endpoint.
    """
    chat_id: Optional[str] = None
    question: str
    answer: str
    ref_file: str


class ChatHistoryRequest(BaseModel):
    """
    The request body for the chat-history endpoint.
    """
    talk_title: str
    detail: Optional[ChatHistoryDetailRequest]
    # language: Optional[Literal["vi", "jp", "en"]] = Field(default="vi", description="Response language (vi: Vietnamese, jp: Japanese, en: English)")


class DeleteChatHistoryRequest(BaseModel):
    """
    The request body for the delete-chat-history endpoint.
    """
    chat_ids: List[str]


class SendFeedbackRequest(BaseModel):
    """
    The request body for the send-feedback endpoint.
    """
    run_id: UUID
    key: str = "user_score"
    score: Union[int, None] = None
    feedback_id: Optional[int] = None
    comment: Optional[str] = None


class ChatStreamRequest(BaseModel):
    """
    The request body for the chat/stream endpoint.
    """
    input: Dict[str, Any] = {
        "question": "",
        "chat_history": []
    }
    config: Optional[Dict[str, Any]] = {"metadata": {}}
    kwargs: Optional[Dict[str, Any]] = {}

    class Config:
        schema_extra = {
            "example": {
                "input": {
                    "question": "Hello, how are you?",
                    "chat_history": [
                        {"human": "Hi", "ai": "Hello! How can I assist you today?"}
                    ]
                },
                "config": {"metadata": {}},
                "language": "vi"
            }
        }


class UpdateFeedbackRequest(BaseModel):
    """
    The request body for the update-feedback endpoint.
    """
    feedback_id: int
    score: Union[int, None] = None
    comment: Optional[str] = None
