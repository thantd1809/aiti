from sqlalchemy import Boolean, Column, DateTime,UniqueConstraint,Index,ForeignKey, Integer, String
from app.models.base import CommonTable

class AccessControlEntry(CommonTable):
    """This class contains file or folder access permissions for users."""

    __tablename__ = "access_control_entry"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    folder_id = Column(String(36), ForeignKey("folders.id"), nullable=True)
    file_id = Column(String(36), ForeignKey("embedding_files.id"), nullable=True)
    # permission_type_id = Column(String(36), ForeignKey("permissions.id"), nullable=True)

    __table_args__ = (
        # UniqueConstraint('user_id', 'folder_id', 'permission_type_id', name='uq_user_folder_permission'),
        # UniqueConstraint('user_id', 'file_id', 'permission_type_id', name='uq_user_file_permission'),
        # UniqueConstraint('department_id', 'folder_id', 'permission_type_id', name='uq_dept_folder_permission'),
        # UniqueConstraint('department_id', 'file_id', 'permission_type_id', name='uq_dept_file_permission'),
        UniqueConstraint('user_id', 'folder_id',  name='uq_user_folder_permission'),
        UniqueConstraint('user_id', 'file_id',  name='uq_user_file_permission'),
        UniqueConstraint('department_id', 'folder_id',  name='uq_dept_folder_permission'),
        UniqueConstraint('department_id', 'file_id',  name='uq_dept_file_permission'),
        Index('ix_folder_id', 'folder_id'),
        Index('ix_file_id', 'file_id'),
        Index('ix_user_id', 'user_id'),
        Index('ix_department_id', 'department_id'),
    )
