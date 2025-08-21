from sqlalchemy import Boolean, Column, DateTime, SmallInteger, String
from app.models.base import CommonTable

class Permission(CommonTable):
    """This class contains permission info"""
    __tablename__ = "permissions"

    code = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)
