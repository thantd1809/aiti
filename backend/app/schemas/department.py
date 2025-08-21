from typing import Optional
from pydantic import BaseModel

class CreateDepartmentRequest(BaseModel):
    """The request body for create department's endpoint"""
    name : str
    parent_id: Optional[str] = None

class UpdateDepartmentRequest(BaseModel):
    """The request body for update-departments endpoint"""
    name : str
    parent_id: Optional[str] = None
