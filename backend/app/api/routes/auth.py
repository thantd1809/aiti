from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.auth import AuthRequest, ChangPasswordRequest, ResetLinkRequest, ActiveUserRequest, RefreshTokenRequest, GoogleRequest, ChangePasswordForgotRequest
from app.logic.auth import AuthLogic
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import AUTH

auth_handler = Auth
security = HTTPBearer()
auth_route = APIRouter()


@auth_route.post("/login", tags=[AUTH])
async def login(request: AuthRequest, db: Session = Depends(get_db)):
    """
    Login API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.login(request)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.post('/check_continue_google', tags=[AUTH])
async def check_continue_google(request: AuthRequest,
                                db: Session = Depends(get_db)):
    """
    Check to allow login google API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.check_continue_google(request)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.post('/continue_google', tags=[AUTH])
async def continue_google(request: GoogleRequest,
                          db: Session = Depends(get_db)):
    """
    Login google API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.continue_google(request)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.post('/refresh_token', tags=[AUTH])
async def refresh_token(request: RefreshTokenRequest,
                        db: Session = Depends(get_db)):
    """
    Refresh token API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.refresh_token(request.refresh_token)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.put('/change_password', tags=[AUTH])
async def change_password(request: ChangPasswordRequest,
                          credentials: HTTPAuthorizationCredentials = Security(
                              security),
                          db: Session = Depends(get_db)):
    """
    Change password API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        # Change initial password, Change the Password on account setting screen
        user = BaseApi(token=credentials.credentials).verify(db)
        response = auth_logic.change_password(request, user.id)

        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.put('/change_forgotten_password', tags=[AUTH])
async def change_password(request: ChangePasswordForgotRequest,
                          db: Session = Depends(get_db)):
    """
    Change password API endpoint when forgotten.
    """
    try:
        auth_logic = AuthLogic(db)
        # Change forgotten password (if current_password empty)
        # Check password and confirm password
        if request.password != request.password_confirm:
            return OutputResponse.error(code="E0004", msg="Password not match")
        response = auth_logic.change_forgotten_password(request)

        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.post('/send_reset_link', tags=[AUTH])
async def send_reset_link(request: ResetLinkRequest,
                          db: Session = Depends(get_db)):
    """
    Send reset link to email API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.send_reset_link(request)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.get('/users/reset/', tags=[AUTH])
async def check_reset_link(q: str, db: Session = Depends(get_db)):
    """
    Check reset link (sent in email) API endpoint.
    """
    try:
        auth_logic = AuthLogic(db)
        response = auth_logic.check_reset_link(q)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@auth_route.put('/send_active_user', tags=[AUTH])
async def active_user(request: ActiveUserRequest,
                      credentials: HTTPAuthorizationCredentials = Security(
                          security),
                      db: Session = Depends(get_db)):
    """
    Active user when already it before(delete flag = 1) API endpoint.
    """
    try:
        # BaseApi(token=credentials.credentials).verify(db).authorize_admin()
        user = BaseApi(token=credentials.credentials).verify(db)
        auth_logic = AuthLogic(db)
        response = auth_logic.active_user(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))
