from typing import List, Optional
from pydantic import BaseModel


class AccessControlRequest(BaseModel):
    """The request body for create access control endpoint"""

    user_id: Optional[str] = None
    department_id: Optional[str] = None
    folder_id: Optional[str] = None
    file_id: Optional[str] = None
    permission_type_id: str


class EditAccessControlRequest(BaseModel):
    """The request body for edit access control endpoint"""

    user_ids: List[str]
    depart_ids: List[str]
    file_id : Optional[str] = None
    folder_id : Optional[str] = None
    permission_type_id : Optional[str] = None
