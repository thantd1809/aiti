from typing import List, Optional
from pydantic import BaseModel

class CreateFolderRequest(BaseModel):
    """The request body for create folder's endpoint"""
    name : str
    parent_id: Optional[str] = None

class UpdateFolderRequest(BaseModel):
    """The request body for update-folders endpoint"""
    name : str
    parent_id: Optional[str] = None

class DeleteFoldersRequest(BaseModel):
    """
    The request body for the delete-users endpoint.
    """
    folder_ids: List[str]
