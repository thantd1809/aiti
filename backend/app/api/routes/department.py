from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.department import CreateDepartmentRequest, UpdateDepartmentRequest
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import DEPARTMENT, ADMIN_ROLE
from app.logic.department import DepartmentLogic

auth_handler = Auth
security = HTTPBearer()
department_route = APIRouter()

@department_route.get('/departments', tags=[DEPARTMENT])
async def departments(credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db),
                search: str = None,
                page: int = 1,
                limit: int = 10
                ):
    """
    Get all departments API endpoint.
    """
    try:
        user = BaseApi(credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        depart_logic = DepartmentLogic(db)
        response = depart_logic.get_all(search=search, page=page, limit=limit)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))
    

@department_route.get('/departments/{id}', tags=[DEPARTMENT])
async def get_users_by_depart_id(id:str, 
                                 credentials: HTTPAuthorizationCredentials = Security(security),
                                 db: Session = Depends(get_db)):
    """Get all users by department id"""
    try:
        user = BaseApi(credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        depart_logic = DepartmentLogic(db)
        response = depart_logic.get_user_in_dept_id(id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))


@department_route.post('/departments', tags=[DEPARTMENT])
async def departments(request: CreateDepartmentRequest,
                credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db)):
    """
    Create department API endpoint.
    """
    try:
        user = BaseApi(credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        department_logic = DepartmentLogic(db)
        response = department_logic.create(request, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))


@department_route.put('/departments/{id}', tags=[DEPARTMENT])
async def update_department(id:str, request: UpdateDepartmentRequest, credentials: HTTPAuthorizationCredentials = Security(security),
                db: Session = Depends(get_db)):
    """Update department API endpoint"""
    try:
        department_logic = DepartmentLogic(db)
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        response = department_logic.update(request, user.id, id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        return OutputResponse.error(msg=str(ex))
    

@department_route.delete('/departments/{id}', tags=[DEPARTMENT])
async def delete_department(id:str,
                             credentials: HTTPAuthorizationCredentials = Security(security),
                             db: Session = Depends(get_db)):
    """Delete a department by ids API endpoint"""
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        department_logic = DepartmentLogic(db)
        response = department_logic.delete(user.id, id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
