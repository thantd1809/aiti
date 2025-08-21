from sqlalchemy import Boolean, Column, DateTime, SmallInteger, String, Integer, ForeignKey
from app.models.base import CommonTable


class User(CommonTable):
    __tablename__ = "users"

    email = Column(String(255), unique=True)
    password = Column(String(255), nullable=True)
    name = Column(String(128), nullable=True)
    google_auth_flg = Column(Boolean, default=False)
    init_lpassword_chang_flg = Column(Boolean, default=False)
    change_password_flg = Column(Boolean, default=False)
    change_password_hash = Column(String(255))
    change_password_dt = Column(DateTime, nullable=True)
    role = Column(SmallInteger)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
