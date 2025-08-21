# from fastapi import APIRouter, Depends, Security
# from sqlalchemy.orm import Session
# from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# from app.core.database import get_db
# from app.utils.auth import Auth
# from app.schemas.permission import DeletePermissionsRequest, CreatePermissionRequest,UpdatePermissionRequest
# from app.utils.response import OutputResponse
# from app.api.routes.base import BaseApi
# from app.core.constants import FOLDER, ADMIN_ROLE, USER_ROLES, PERMISSION
# from app.logic.permission import PermissionLogic

# auth_handler = Auth
# security = HTTPBearer()
# permission_route = APIRouter()

# @permission_route.post('/permissions', tags=[PERMISSION])
# async def permissions(request:CreatePermissionRequest,
#                     credentials: HTTPAuthorizationCredentials = Security(security),
#                     db: Session = Depends(get_db)):
#     """Create permission API endpoint"""
#     try:
#        user = BaseApi(credentials.credentials).verify(db)
#        permission_logic = PermissionLogic(db)
#        response = permission_logic.create(request, user.id)
#        return response
#     except Exception as ex:
#         # Catch any other unexpected exceptions
#         return OutputResponse.error(msg=str(ex))
    
# @permission_route.put('/permissions/{id}', tags=[PERMISSION])
# async def update_permission(id:int, request:UpdatePermissionRequest,
#                         credentials: HTTPAuthorizationCredentials = Security(security),
#                         db: Session = Depends(get_db)):
#     """Update permission API endpoint"""
#     try:
#         permission_logic = PermissionLogic(db)
#         user = BaseApi(token=credentials.credentials).verify(db)
#         response = permission_logic.update(request, user.id, id)
#         return response
#     except Exception as ex:
#         # Catch any other unexpected exceptions
#         return OutputResponse.error(msg=str(ex))
    
# @permission_route.delete('/permissions/{id}', tags=[PERMISSION])
# async def delete_permission(id:int,
#                         credentials: HTTPAuthorizationCredentials = Security(security),
#                         db: Session = Depends(get_db)):
#     """Delete a permission by ids API endpoint"""
#     try:
#         user = BaseApi(token=credentials.credentials).verify(db)
#         if user.role != ADMIN_ROLE:
#             return OutputResponse.error(code="E0001", msg="Unauthorized")
#         permission_logic = PermissionLogic(db)
#         response = permission_logic.delete(user.id, id)
#         return response
#     except Exception as ex:
#         return OutputResponse.error(msg=str(ex))
