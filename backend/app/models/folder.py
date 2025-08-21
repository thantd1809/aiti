from sqlalchemy import Boolean, Column, DateTime,Integer,ForeignKey, SmallInteger, String
from app.models.base import CommonTable

class Folder(CommonTable):
    """This class contains folder info"""
    __tablename__ = "folders"

    name = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey("folders.id"), nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)

