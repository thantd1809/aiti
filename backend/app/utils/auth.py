"""
Utility for authentication.
"""
import jwt
from fastapi import HTTPException
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.message import S0001, S0002, S0003


class AuthInfo:
    """
    Authentication information.
    """

    def __init__(self, subject: str, role: int, id: int, name: str, department_id: int ):
        self.subject = subject  # email
        self.role = role  # 管理者：1, 一般：2
        self.id = id  # user id
        self.name = name
        self.department_id = department_id


class TokenInfo:
    """
    Token information.
    """

    def __init__(self, scope: str, exp: int):
        self.scope = scope  # access_token, refresh_token
        self.exp = exp  # minutes


class Auth:
    """
    Utility class for authentication.
    """
    hasher = CryptContext(schemes=['bcrypt'])
    secret = settings.SECRET_KEY

    def encode_password(self, password):
        """
        Encode the password.
        """
        return self.hasher.hash(password)

    def verify_password(self, password, encoded_password):
        """
        Verify the password.
        """
        return self.hasher.verify(password, encoded_password)

    def encode_token(self, authInfo: AuthInfo, tokenInfo: TokenInfo):
        """
        Encode the token.
        """
        payload = {
            'exp': datetime.now(timezone.utc) + timedelta(days=1, minutes=tokenInfo.exp),
            'iat': datetime.now(timezone.utc),
            'scope': tokenInfo.scope,
            'sub': authInfo.subject,
            'role': authInfo.role,
            'id': authInfo.id,
            'name': authInfo.name,
            'department_id': authInfo.department_id 
        }
        return jwt.encode(
            payload,
            self.secret,
            algorithm='HS256'
        )

    def decode_token(self, token_value, token_type="access_token"):
        """
        Decode the token.
        """
        try:
            payload = jwt.decode(
                token_value,
                self.secret,
                algorithms=['HS256'])
            if (payload['scope'] == token_type):
                return AuthInfo(payload['sub'], payload['role'], payload['id'], payload['name'], payload['department_id'])
            raise HTTPException(
                status_code=401,
                detail={"code": "S0001", "msg": S0001, "item": [token_type]})
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail={"code": "S0002", "msg": S0002, "item": [token_type]})
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=401,
                detail={"code": "S0003", "msg": S0003, "item": [token_type]})
