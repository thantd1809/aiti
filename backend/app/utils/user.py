"""
The validation user data.
"""
from app.services.user import UserCRUD


class UserValid:
    def __init__(self, db):
        self.user_crud = UserCRUD(db)

    def check_email_valid(self, email):
        """
        Check if the email is valid.
        """
        try:
            user = self.user_crud.get_by_email(email)
            return user
        except Exception as ex:
            raise ex

    def check_email_is_deleted_valid(self, email):
        """
        Check if the email is valid and is deleted.
        """
        try:
            user = self.user_crud.get_by_email_is_deleted(email)
            return user
        except Exception as ex:
            raise ex

    def check_google_auth_valid(self, email, google_auth):
        """
        Check if the google auth is valid.
        """
        try:
            user = self.user_crud.get_by_google_auth(email, google_auth)
            return user
        except Exception as ex:
            raise ex

    def check_user_id_valid(self, id):
        """
        Check if the user ID is valid.
        """
        try:
            user = self.user_crud.get_by_id(id)
            return user
        except Exception as ex:
            raise ex
