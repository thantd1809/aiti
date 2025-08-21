"""
User logic module
"""
from datetime import datetime
from uuid import uuid4

from app.services.user import UserCRUD
from app.services.notifications import NotificationBadgeCRUD
from app.models.user import User
from app.schemas.user import UserRequest, UpdateUserRequest, DeleteUserRequest
from app.utils.auth import Auth
from app.utils.response import OutputResponse
from app.utils.user import UserValid
from app.core.constants import DATE_FORMAT
from app.core.message import E0012, E0023, I0001, I0002, I0003


class UserLogic:
    """
    User logic class
    """

    def __init__(self, db):
        self.auth_handler = Auth()
        self.user_crud = UserCRUD(db)
        self.notification_crud = NotificationBadgeCRUD(db)

    def create(self, request: UserRequest, user_id: str) -> OutputResponse:
        """
        Create a new user
        """
        try:
            id = uuid4()
            user_valid = UserValid(self.user_crud.db)
            result_email = user_valid.check_email_valid(request.email)
            result_email_is_deleted = user_valid.check_email_is_deleted_valid(
                request.email)
            if result_email:
                return OutputResponse.error(code="E0012", msg=E0012)
            elif result_email_is_deleted:
                return OutputResponse.error(code="E0023", msg=E0023)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            user_model = User(
                id=id,
                email=request.email,
                password=self.auth_handler.encode_password(request.password),
                name=request.name,
                google_auth_flg=request.google_auth_flg,
                init_lpassword_chang_flg=request.init_lpassword_chang_flg,
                role=request.role,
                created_at=current_date_time,
                created_by=user_id,
                department_id = request.department_id if request.department_id else None,
            )

            self.user_crud.create(user_model)
            self.notification_crud.create_badge(str(id))
            # I0001
            return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get(self, id):
        """
        Get user by id
        """
        try:
            # Accessing data from the request
            result_user = self.user_crud.get_by_id(id)
            if not result_user:
                return OutputResponse.error(code="E0002", msg="User not found", status_code=404)
            # I0003
            user = {
                "user_id": result_user.id,
                "email": result_user.email,
                "name": result_user.name,
                "role": result_user.role,
                "pwd_status": result_user.init_lpassword_chang_flg,
                "login_google": result_user.google_auth_flg
            }
            return OutputResponse.success(data=user)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get_all(self, search: str = None, page: int = 1, limit: int = 10):
        """
        Get all users with optional search, pagination
        """
        try:
            # Process the data as needed
            list_user, total = self.user_crud.list_and_sort(
                search, page, limit)
            users = [
                {
                    "id": item.id,
                    "email": item.email,
                    "name": item.name,
                    "role": item.role,
                    "department": department_name
                }
                for item, department_name in list_user
            ]
            data = {
                "users": users,

            }
            return OutputResponse.success_with_pagination(data=data, page=page, limit=limit, total=total)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete(self, request: DeleteUserRequest, user_id: str):
        """
        Delete the user
        """
        try:
            # Accessing data from the request
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.user_crud.delete(
                request.user_ids, current_date_time, user_id)
            # I0003
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def update_user(self, request: UpdateUserRequest, id: str, login_user_id: str) -> OutputResponse:
        """
        Update the user
        """
        try:
            # Process the data as needed
            result_user = self.user_crud.get_by_id(id)
            if not result_user:
                return OutputResponse.error(code="E0002", msg="User not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.user_crud.update_user(
                id,
                request.name,
                request.role,
                current_date_time,
                login_user_id)
            # I0002
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
