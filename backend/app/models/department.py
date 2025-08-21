from sqlalchemy import Column,Integer,ForeignKey, String
from app.models.base import CommonTable

class Department(CommonTable):
    """This class contains department info"""
    __tablename__ = "departments"

    name = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
