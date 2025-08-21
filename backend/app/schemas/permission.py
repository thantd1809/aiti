from typing import List, Optional
from pydantic import BaseModel

class CreatePermissionRequest(BaseModel):
    """The request body for create permission's endpoint"""
    code : int
    description: Optional[str] = None

class UpdatePermissionRequest(BaseModel):
    """The request body for update-permissions endpoint"""
    code : int
    description: Optional[str] = None

class DeletePermissionsRequest(BaseModel):
    """
    The request body for the delete-users endpoint.
    """
    permission_ids: List[str]
