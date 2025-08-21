from app.services.notifications import NotificationBadgeCRUD, NotificationCRUD
from app.models.notification import Notification
from datetime import datetime


class NotificationBadgeLogic:
    def __init__(self, db):
        self.db = db
        self.notification_crud = NotificationBadgeCRUD(db)

    def get_notifications_badge(self, user_id: str):
        """Get notification badge for a user"""
        try:
            badge = self.notification_crud.get_by_user_id(user_id)
            if badge:
                return {"user_id": user_id, "badge_count": badge.unread_count}
            else:
                return {"user_id": user_id, "badge_count": 0}
        except Exception as e:
            self.db.rollback()
            raise e
        
    def read_notification_badge(self, user_id: str):
        """Mark notification badge as read for a user"""
        try:
            self.notification_crud.update_unread_count(user_id)
        except Exception as e:
            self.db.rollback()
            raise e
        
class NotificationLogic:
    def __init__(self, db):
        self.db = db
        self.notification_crud = NotificationCRUD(db)

    def create_notification(self, user_id: str, title: str, content: str, folder_id: str = None):
        """Create a new notification"""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                content=content,
                folder_id=folder_id,
                created_at=datetime.now(),
                created_by=user_id
            )
            self.notification_crud.create(notification)
            return notification
        except Exception as e:
            self.db.rollback()
            raise e
        
    def get_notifications(self, user_id: str, limit: int = 10, offset: int = 0):
        """Get all notifications for a user"""
        try:
            notifications, total = self.notification_crud.get_by_user_id(user_id, limit=limit, offset=offset)
            return notifications, total
        except Exception as e:
            self.db.rollback()
            raise e
        
    def read_notification(self, notification_id: str, user_id: str):
        """Mark a notification as read"""
        try:
            notification = self.notification_crud.get_by_id(notification_id)
            if notification and notification.user_id == user_id:
                notification.read_flg = True
                self.notification_crud.update(notification)
            else:
                raise ValueError("Notification not found or does not belong to the user")
        except Exception as e:
            self.db.rollback()
            raise e
        
    def read_all_notifications(self, user_id: str):
        """Mark all notifications as read for a user"""
        try:
            self.notification_crud.read_all_notifications(user_id)
        except Exception as e:
            self.db.rollback()
            raise e