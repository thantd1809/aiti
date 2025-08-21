from typing import Optional
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.access_control import EditAccessControlRequest
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import ACCESS_CONTROL
from app.logic.access_control import AccessControlLogic

auth_handler = Auth
security = HTTPBearer()
access_control_route = APIRouter()


@access_control_route.get("/access_control", tags=[ACCESS_CONTROL])
async def get_access_control(
    file_id: Optional[str] = None,
    folder_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    """Get access control API endpoint"""
    try:
        user = BaseApi(credentials.credentials).verify(db)
        access_control_logic = AccessControlLogic(db)
        response = access_control_logic.get(file_id, folder_id, user.id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))


@access_control_route.put("/access_control", tags=[ACCESS_CONTROL])
async def edit_access_control(
    request: EditAccessControlRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    """Edit a permission by ids API endpoint"""
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        access_control_logic = AccessControlLogic(db)
        response = access_control_logic.edit_access_control(
            request, user.id
        )
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))
