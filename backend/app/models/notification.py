from sqlalchemy import Boolean, Column, DateTime, String, Integer, ForeignKey
from app.models.base import CommonTable


class Notification(CommonTable):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(String(1024), nullable=False)
    read_flg = Column(Boolean, default=False)
    file_id = Column(String(36), nullable=True)
    folder_id = Column(String(36), nullable=True)


class NotificationBadge(CommonTable):
    __tablename__ = "notification_badges"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    unread_count = Column(Integer, default=0)
    last_notification_dt = Column(DateTime, nullable=True)

