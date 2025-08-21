from typing import Optional
from pydantic import BaseModel


class AuthRequest(BaseModel):
    """
    The request body for the login-user or continue_google-user endpoint.
    """
    email: str
    password: Optional[str]


class GoogleRequest(BaseModel):
    """
    The request body for the continue_google-user endpoint.
    """
    name: str
    email: str
    password: Optional[str]


class ChangPasswordRequest(BaseModel):
    """
    The request body for the change-password endpoint.
    """
    current_password: Optional[str] = None
    password: str
    password_confirm: str


class ChangePasswordForgotRequest(BaseModel):
    """
    The request body for the change-password-forgot endpoint.
    """
    password: str
    password_confirm: str
    token: str


class ResetLinkRequest(BaseModel):
    """
     The request body for the reset-password endpoint.
    """
    email: str


class ActiveUserRequest(BaseModel):
    """
    The request body for the active-user endpoint.
    """
    email: str


class RefreshTokenRequest(BaseModel):
    """
    The request body for the refresh-token endpoint.
    """
    refresh_token: str
