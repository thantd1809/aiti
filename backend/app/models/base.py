from app.core.database import Base
from sqlalchemy import Column, DateTime, Integer, String
import uuid 
from sqlalchemy.dialects.postgresql import UUID


class CommonTable(Base):
    """
    This class is the base class for all the tables in the database.
    """
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, nullable=False)
    created_by = Column(String(36), nullable=True)
    updated_at = Column(DateTime, nullable=True)
    updated_by = Column(String(36), nullable=True)
    delete_flag = Column(Integer, default=0)
