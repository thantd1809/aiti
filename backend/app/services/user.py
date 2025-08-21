from typing import List
from app.services.base import CommonCRUD
from app.models.user import User
from app.models.department import Department
from sqlalchemy import update, and_
from datetime import datetime, timedelta


class UserCRUD(CommonCRUD):
    """
    CRUD class for the User model
    """

    def get_by_email(self, email: str):
        """
        Get a user by email
        """
        try:
            return self.db.query(User).filter(User.email == email,
                                              User.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_email_is_deleted(self, email: str):
        """
        Get a user by email(is_deleted = 1)
        """
        try:
            return self.db.query(User).filter(User.email == email,
                                              User.delete_flag == 1).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_google_auth(self, email, google_auth):
        """
        Get a user by email and google_auth_flg
        """
        try:
            return self.db.query(User).filter(User.email == email,
                                              User.google_auth_flg == google_auth,
                                              User.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_id(self, id: str):
        """
        Get a user by id
        """
        try:
            return self.db.query(User).filter(User.id == id,
                                              User.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_password_hash(self, hash_key: str):
        """
        Get a user by password hash key when reseting password
        """
        try:
            five_minutes_ago = datetime.now() - timedelta(minutes=5)
            return self.db.query(User).filter(
                User.change_password_flg == True,
                User.change_password_hash == hash_key,
                User.delete_flag == 0,
                User.change_password_dt >= five_minutes_ago
            ).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def update_password(self, new_password, current_date_time, user_id):
        """
        Update the password of a user
        """
        try:
            # Update the fields
            update_stmt = (update(User).values(
                init_lpassword_chang_flg=True,
                password=new_password,
                updated_at=current_date_time
            ).where(and_(User.id == user_id, User.delete_flag == 0)))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def update_forgotten_password(self, id, new_password, current_date_time, login_user_id):
        """
        Update the password hash key of a user when forgotten password
        """
        try:
            # Update the fields
            update_stmt = (update(User).values(
                change_password_flg=False,
                password=new_password,
                change_password_hash=None,
                change_password_dt=None,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(User.id == id).where(User.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def update_reset_link(self, id, change_password_hash, current_date_time, login_user_id):
        """
        Update the password of a user when reseting password
        """
        try:
            # Update the fields
            update_stmt = (update(User).values(
                change_password_flg=True,
                change_password_hash=change_password_hash,
                change_password_dt=current_date_time,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(User.id == id).where(User.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def list_and_sort(self, search: str = None, page: int = 1, limit: int = 10):
        """
        Get a list of users and sort them
        """
        try:

            # Define the conditions
            conditions = (User.delete_flag == 0)
            if search:
                conditions = conditions & (
                    User.email.ilike(f"%{search}%") | User.name.ilike(f"%{search}%"))

            # Query with outer join to Department
            user_query = (
                self.db.query(
                    User,
                    Department.name.label("department_name")
                )
                .outerjoin(Department, User.department_id == Department.id)
                .filter(conditions)
            )
            total = user_query.count()
            user_list = (
                user_query
                .offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            return user_list, total
        except Exception as ex:
            self.db.rollback()
            raise ex

    def delete(self, ids: List[str], current_date_time, login_user_id):
        """
        Delete a list of users
        """
        try:

            # Update the user table
            update_user_stmt = (update(User).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(User.id.in_(ids)).where(User.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_user_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def update_user(self, id, name, role, current_date_time, login_user_id):
        """
        Update a user's information
        """
        try:
            # Update the user table
            update_user_stmt = (update(User).values(
                name=name,
                role=role,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where((User.id == id)).where(User.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_user_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def active_user(self, email, current_date_time, login_user_id):
        """
        Active a user(is_deleted = 0)
        """
        try:
            # Update the user table
            update_user_stmt = (update(User).values(
                delete_flag=0,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where((User.email == email)).where(User.delete_flag == 1))

            # Execute the update statement
            self.db.execute(update_user_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

