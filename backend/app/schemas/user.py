from typing import List, Union
from pydantic import BaseModel


class UserRequest(BaseModel):
    """
    The request body for the users' endpoint.
    """
    email: str
    password: str
    name: str
    google_auth_flg: Union[bool, None] = False
    init_lpassword_chang_flg: Union[bool, None] = False
    change_password_flg: Union[bool, None] = False
    role: int
    department_id : str = None


class UpdateUserRequest(BaseModel):
    """
    The request body for update-users endpoint.
    """
    name: str
    role: int


class DeleteUserRequest(BaseModel):
    """
    The request body for the delete-users endpoint.
    """
    user_ids: List[str]
