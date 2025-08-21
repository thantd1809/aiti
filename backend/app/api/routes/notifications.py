from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.logic.notifications import NotificationBadgeLogic, NotificationLogic
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import NOTIFICATIONS
from app.core.message import I0001, I0010
from app.schemas.notificatons import ReadNotificationRequest

auth_handler = Auth
security = HTTPBearer()
noti_route = APIRouter()


@noti_route.get('/notifications_badge', tags=[NOTIFICATIONS])
async def get_notifications_badge(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Get notifications badge API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        noti_logic = NotificationBadgeLogic(db)
        data = noti_logic.get_notifications_badge(user.id)
        return OutputResponse.success(data=data)
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))
    
@noti_route.post('/read_notification_badge', tags=[NOTIFICATIONS])
async def create_notification_badge(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Read notification badge API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        noti_logic = NotificationBadgeLogic(db)
        noti_logic.read_notification_badge(user.id)
        return OutputResponse.success()
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    

@noti_route.get('/notifications', tags=[NOTIFICATIONS])
async def get_notifications(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 10
):
    """
    Get notifications API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        noti_logic = NotificationLogic(db)
        notifications, total = noti_logic.get_notifications(user.id, limit=page_size, offset=(page - 1) * page_size)
        data = [
            {
                "id": notification.id,
                "title": notification.title,
                "content": notification.content,
                "created_at": notification.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "is_read": notification.read_flg
            }
            for notification in notifications
        ]
        return OutputResponse.success_with_pagination(
            data=data,
            total=total,
            page=page,
            limit=page_size,
            msg=I0010
        )
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))

@noti_route.post('/notifications/read', tags=[NOTIFICATIONS])
async def read_notification(
    request: ReadNotificationRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Read a specific notification API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        noti_logic = NotificationLogic(db)
        noti_logic.read_notification(request.notification_id, user.id)
        return OutputResponse.success(msg=I0010)
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    
@noti_route.post('/notifications/read_all', tags=[NOTIFICATIONS])
async def read_all_notifications(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Read all notifications API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        noti_logic = NotificationLogic(db)
        noti_logic.read_all_notifications(user.id)
        return OutputResponse.success(msg=I0010)
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))