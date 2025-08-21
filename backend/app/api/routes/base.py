"""
Base API class to handle common functions for all APIs.
"""
from fastapi import HTTPException
from app.utils.auth import Auth, AuthInfo
from app.utils.user import UserValid
from app.core.message import S0004, S0005


class BaseApi:
    """
    Base API class to handle common functions for all APIs.
    """
    auth_info: AuthInfo

    def __init__(self, token, token_type="access_token"):
        self.auth_handler = Auth()
        try:
            self.auth_info = self.auth_handler.decode_token(
                token, token_type) if token else None
        except HTTPException as ex:
            raise ex

    def verify(self, db):
        """
        Verify the token and check if the user is valid.
        """
        if not self.auth_info:
            raise HTTPException(status_code=401, detail={
                                "code": "S0004", "msg": S0004})
        user_valid = UserValid(db)
        user = user_valid.check_email_valid(self.auth_info.subject)
        if not user:
            raise HTTPException(status_code=401, detail={
                                "code": "S0005", "msg": S0005})
        return user
