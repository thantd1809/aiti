from app.services.base import CommonCRUD
from app.models.notification import Notification, NotificationBadge
from sqlalchemy import delete, or_, update, and_
from datetime import datetime

class NotificationCRUD(CommonCRUD):
    """CRUD class for Notification model"""

    def get_by_id(self, notification_id: str):
        """Get notification by ID"""
        try:
            return self.db.query(Notification).filter(
                Notification.id == notification_id
            ).first()
        except Exception as e:
            self.db.rollback()
            raise e

    def get_by_user_id(self, user_id: str, limit: int = 10, offset: int = 0):
        """Get notifications by user ID with pagination and total count, ordered by created_at"""
        try:
            query = self.db.query(Notification).filter(
                Notification.user_id == user_id
            ).order_by(Notification.created_at.desc())
            total = query.count()
            notifications = query.limit(limit).offset(offset).all()
            return notifications, total
        except Exception as e:
            self.db.rollback()
            raise e

    def delete_by_user_id(self, user_id: str):
        """Delete all notifications for a user"""
        stmt = delete(Notification).where(Notification.user_id == user_id)
        try:
            self.db.execute(stmt)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

    def read_notification(self, notification_id: str):
        """Mark a notification as read"""
        stmt = (
            update(Notification)
            .values(read_flg=True)
            .where(Notification.id == notification_id)
        )
        try:
            self.db.execute(stmt)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

    def read_all_notifications(self, user_id: str):
        """Mark all notifications for a user as read"""
        stmt = (
            update(Notification)
            .values(read_flg=True)
            .where(Notification.user_id == user_id)
        )
        try:
            self.db.execute(stmt)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
        
    def update(self, notification: Notification):
        """Update a notification"""
        try:
            self.db.merge(notification)
            self.db.commit()
            return notification
        except Exception as e:
            self.db.rollback()
            raise e


class NotificationBadgeCRUD(CommonCRUD):
    """CRUD class for NotificationBadge model"""

    def get_by_user_id(self, user_id: str):
        """Get notification badge by user ID"""
        try:
            return self.db.query(NotificationBadge).filter(
                NotificationBadge.user_id == user_id
            ).first()
        except Exception as e:
            self.db.rollback()
            raise e

    def update_badge(self, user_id: str, last_notification_dt):
        """Update notification badge for a user"""
        stmt = (
            update(NotificationBadge)
            .values(
            unread_count=NotificationBadge.unread_count + 1,
            last_notification_dt=last_notification_dt
            )
            .where(NotificationBadge.user_id == user_id)
        )
        try:
            self.db.execute(stmt)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

    def create_badge(self, user_id: str):
        """Create a new notification badge for a user"""
        current_time = datetime.now()
        try:
            new_badge = NotificationBadge(
                user_id=user_id,
                unread_count=0,
                last_notification_dt=current_time,
                created_at=current_time
            )
            self.db.add(new_badge)
            self.db.commit()
            self.db.refresh(new_badge)
            return new_badge
        except Exception as e:
            self.db.rollback()
            raise e
    
    def notify_and_update_badge(self, user_ids: list, message: str):
        """Notify users and update their notification badges"""
        current_time = datetime.now()
        try:
            for user_id in user_ids:
                # Create a notification for each user
                notification = Notification(
                    user_id=user_id,
                    message=message,
                    created_at=current_time
                )
                self.db.add(notification)
                self.update_badge(user_id, current_time)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

    def update_unread_count(self, user_id: str):
        """Update unread count for a user's notification badge"""
        stmt = (
            update(NotificationBadge)
            .values(unread_count=0)
            .where(NotificationBadge.user_id == user_id)
        )
        try:
            self.db.execute(stmt)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
    
    def bulk_create_badges(self, user_ids: list):
        """Create notification badges in bulk for multiple users"""
        current_time = datetime.now()
        try:
            badges = [
                NotificationBadge(
                    user_id=user_id,
                    unread_count=0,
                    last_notification_dt=current_time,
                    created_at=current_time
                )
                for user_id in user_ids
            ]
            self.db.add_all(badges)
            self.db.commit()
            return badges
        except Exception as e:
            self.db.rollback()
            raise e


