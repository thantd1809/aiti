from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.user import UserRequest, DeleteUserRequest, UpdateUserRequest
from app.logic.user import UserLogic
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import USER, ADMIN_ROLE, USER_ROLES

auth_handler = Auth
security = HTTPBearer()
user_route = APIRouter()


@user_route.get('/users', tags=[USER])
async def users(credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db),
                search: str = None,
                page: int = 1,
                limit: int = 10
                ):
    """
    Get all users API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != 1:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        user_logic = UserLogic(db)
        response = user_logic.get_all(search=search, page=page, limit=limit)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))


@user_route.get('/users/{id}', tags=[USER])
async def get_user(id: str, credentials: HTTPAuthorizationCredentials = Security(security),
                   db: Session = Depends(get_db)):
    """
    Get a user by id API endpoint.
    """
    try:
        BaseApi(token=credentials.credentials).verify(db)
        user_logic = UserLogic(db)
        response = user_logic.get(id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@user_route.post('/users', tags=[USER])
async def users(request: UserRequest,
                credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db)):
    """
    Create user API endpoint.
    """
    try:
        user = BaseApi(credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        if request.role not in USER_ROLES:
            return OutputResponse.error(code="E0004", msg="Role not found")
        user_logic = UserLogic(db)
        response = user_logic.create(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@user_route.put('/users', tags=[USER])
async def update_user(request: UpdateUserRequest,
                      credentials: HTTPAuthorizationCredentials = Security(
                          security),
                      db: Session = Depends(get_db)):
    """
    Update user API endpoint.
    """
    try:
        user_logic = UserLogic(db)
        # Change initial password, Change the Password on account setting screen
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        response = user_logic.update_user(request)

        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@user_route.delete('/users', tags=[USER])
async def users(request: DeleteUserRequest,
                credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db)):
    """
    Delete a list user by ids API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        user_logic = UserLogic(db)
        response = user_logic.delete(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))


@user_route.get("/me", tags=[USER])
async def get_me(credentials: HTTPAuthorizationCredentials = Security(security),
                 db: Session = Depends(get_db)):
    """
    Get my info API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        user_logic = UserLogic(db)
        response = user_logic.get(user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@user_route.put('/users/{id}', tags=[USER])
async def update_user(id: str, request: UpdateUserRequest,
                      credentials: HTTPAuthorizationCredentials = Security(
                          security),
                      db: Session = Depends(get_db)):
    """
    Update user API endpoint.
    """
    try:
        user_logic = UserLogic(db)
        # Change initial password, Change the Password on account setting screen
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        # Check Role exist
        if request.role not in USER_ROLES:
            return OutputResponse.error(code="E0004", msg="Role not found")
        response = user_logic.update_user(request, id, user.id)

        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))
