from sqlalchemy import Column, DateTime, SmallInteger, String, Integer, ForeignKey, Boolean
from app.models.base import CommonTable


class Upload(CommonTable):
    """
    This class represents the uploads table in the database.
    """
    __tablename__ = "embedding_files"

    name = Column(String(255), nullable=False, comment="File name")
    file_extension = Column(String(10), nullable=False,
                            comment="File extension")
    file_size = Column(String(15), nullable=False,
                       comment="File size in bytes")
    url = Column(String(255), nullable=True)
    url_expire_time = Column(DateTime, nullable=True)
    folder_id = Column(String(36), ForeignKey("folders.id"), nullable=True)
    is_error = Column(Boolean, default=False, nullable=True,
                      comment="Indicates if the upload has an error")
