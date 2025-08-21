"""Permission logic module"""

from datetime import datetime

from app.services.permission import PermissionCRUD
from app.models.permission import Permission
from app.utils.auth import Auth
from app.utils.response import OutputResponse
from app.core.constants import DATE_FORMAT
from app.core.message import E0012, E0023, I0001, I0002, I0003
from app.schemas.permission import CreatePermissionRequest, DeletePermissionsRequest,UpdatePermissionRequest

class PermissionLogic:
    """Permission logic class"""

    def __init__(self, db):
        self.auth_handle = Auth()
        self.permission_crud = PermissionCRUD(db)

    def create(self, request:CreatePermissionRequest, user_id:str)->OutputResponse:
        """Create a new permission"""
        try:
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            permission_model = Permission(
                code=request.code,
                description=request.description,
                created_at=current_date_time,
                created_by=user_id
            )
            self.permission_crud.create(permission_model)
            return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        
    def update(self, request:UpdatePermissionRequest, user_id:str, id:str)->OutputResponse:
        """Update the permission"""
        try:
            result_permission = self.permission_crud.get_by_id(id)
            if not result_permission:
                return OutputResponse.error(code="E0002", msg="Permission not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.permission_crud.update(
                id,
                request.code,
                request.description,
                current_date_time,
                user_id
            )
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        
    def delete(self, user_id:str, id: str)->OutputResponse:
        """Delete a permission"""
        try:
            result_permission = self.permission_crud.get_by_id(id)
            if not result_permission:
                return OutputResponse.error(code="E0002", msg="Permission not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.permission_crud.delete(id, current_date_time, user_id)
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
