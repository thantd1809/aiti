from typing import Optional
from pydantic import BaseModel

class ReadNotificationRequest(BaseModel):
    """The request body for read notification's endpoint"""
    notification_id: str
