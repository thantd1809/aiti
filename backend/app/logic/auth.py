"""
Auth logic module
"""
from datetime import datetime, timedelta

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.services.user import UserCRUD
from app.schemas.auth import AuthRequest
from app.utils.auth import Auth, AuthInfo, TokenInfo
from app.utils.response import OutputResponse
from app.utils.user import UserValid
from app.core.constants import ACCESS_TOKEN_EXP, DATE_FORMAT, REFRESH_TOKEN_EXP, SERVER_EMAIL, SUBJECT_EMAIL, \
    BODY_EMAIL, GENERAL_ROLE, RESET_LINK_EXP
from app.core.message import E0001, E0019, E0020, E0021, I0002, I0008, E0004, E0018, E0017, E0026
from app.models.user import User
from app.schemas.auth import ChangPasswordRequest, ResetLinkRequest, ActiveUserRequest, ChangePasswordForgotRequest
from app.core.config import settings


class AuthLogic:
    """
    Auth logic class
    """

    def __init__(self, db):
        self.user_crud = UserCRUD(db)
        self.auth_handler = Auth()

    def login(self, request: AuthRequest):
        """
        Login with email and password
        """
        try:
            # Check the existence of login with Google
            user_valid = UserValid(self.user_crud.db)
            result_google_auth = user_valid.check_google_auth_valid(
                request.email, True)
            if result_google_auth:
                return OutputResponse.error(code="E0020", msg=E0020)
            # Check the existence of email and password
            result_user = user_valid.check_email_valid(request.email)

            if not result_user:
                return OutputResponse.error(code="E0001", msg=E0001)
            elif not self.auth_handler.verify_password(request.password, result_user.password):
                return OutputResponse.error(code="E0001", msg=E0001)
            user = {
                "pwd_status": result_user.init_lpassword_chang_flg,
                "access_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name, result_user.department_id),
                    TokenInfo("access_token", ACCESS_TOKEN_EXP)),
                "refresh_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name, result_user.department_id),
                    TokenInfo("refresh_token", REFRESH_TOKEN_EXP)),

            }
            return OutputResponse.success(data=user)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def check_continue_google(self, request: AuthRequest):
        """
        Check continue with Google
        """
        try:
            # Check the existence of login with email and password
            user_valid = UserValid(self.user_crud.db)
            result_google_auth = user_valid.check_google_auth_valid(
                request.email, False)
            if result_google_auth:
                return OutputResponse.error(code="E0019", msg=E0019)
            return OutputResponse.success()
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def continue_google(self, request: AuthRequest):
        """
        Login with Google
        """
        try:
            # Check the existence of login with email and password
            user_valid = UserValid(self.user_crud.db)
            result_google_auth = user_valid.check_google_auth_valid(
                request.email, False)
            if result_google_auth:
                return OutputResponse.error(code="E0019", msg=E0019)

            # Check the existence of user information
            result_user = user_valid.check_google_auth_valid(
                request.email, True)

            if not result_user:
                # if it does not exist, create a user
                current_date_time = datetime.now().strftime(DATE_FORMAT)
                # set created_by default login_user_id = 0, then set created_by = id after this id is created
                result_user = User(
                    email=request.email,
                    name=request.name,
                    google_auth_flg=True,
                    init_lpassword_chang_flg=True,
                    role=GENERAL_ROLE,
                    created_at=current_date_time,
                    created_by=0)
                # result_user.created_by = result_user.id
                self.user_crud.create(result_user)
            user = {
                "user_id": result_user.id,
                "pwd_status": result_user.init_lpassword_chang_flg,
                "access_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name),
                    TokenInfo("access_token", ACCESS_TOKEN_EXP)),
                "refresh_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name),
                    TokenInfo("refresh_token", REFRESH_TOKEN_EXP)),
                "role": result_user.role,

            }
            return OutputResponse.success(data=user)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def change_password(self, request: ChangPasswordRequest, user_id: str) -> OutputResponse:
        """
        Change the password
        """
        try:
            # Check password and password confirmation
            if request.password != request.password_confirm:
                return OutputResponse.error(code="E0020", msg=E0026, item=["password_confirm"])
            # Accessing data from the request
            user_valid = UserValid(self.user_crud.db)
            result_user = user_valid.check_user_id_valid(user_id)

            if not result_user:
                return OutputResponse.error(code="E0004", msg=E0004, item=["current_password"])
            elif not self.auth_handler.verify_password(
                    request.current_password,
                    result_user.password):
                return OutputResponse.error(code="E0004", msg=E0004, item=["current_password"])
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.user_crud.update_password(
                self.auth_handler.encode_password(request.password),
                current_date_time, user_id
            )
            # I0002
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def change_forgotten_password(self, request: ChangePasswordForgotRequest):
        """
        Change the forgotten password
        """
        try:
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            # Check token and time expiration
            result_user = self.user_crud.get_by_password_hash(request.token)
            if not result_user:
                return OutputResponse.error(code="E0018", msg=E0018)
            self.user_crud.update_forgotten_password(
                result_user.id,
                self.auth_handler.encode_password(request.password),
                current_date_time,
                result_user.id)
            # I0002
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def send_reset_link(self, request: ResetLinkRequest):
        """
        Send the reset link
        """
        try:
            # Reset link
            # /reset/{hash}
            user_valid = UserValid(self.user_crud.db)
            result_user = user_valid.check_email_valid(request.email)

            if not result_user:
                return OutputResponse.error(code="E0004", msg=E0004, item=["email"])
            change_password_hash = self.auth_handler.encode_password(
                request.email)

            # Check the existence of Google account
            result_google_auth = user_valid.check_google_auth_valid(
                request.email, True)
            if result_google_auth:
                return OutputResponse.error(code="E0021", msg=E0021)

            reset_link = settings.PRODUCT_BASE_URL + \
                f"/reset/?q={change_password_hash}"

            content = BODY_EMAIL.replace("{reset_link}", reset_link)

            # Store hash email under DB
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            response = self.user_crud.update_reset_link(
                result_user.id,
                change_password_hash,
                current_date_time,
                result_user.id)
            if response:
                # Create message container
                # The correct MIME type is multipart/alternative.
                msg = MIMEMultipart('alternative')
                msg['From'] = settings.SENDER_EMAIL
                msg['To'] = request.email
                msg['Subject'] = SUBJECT_EMAIL

                # Attach body
                msg.attach(MIMEText(content, 'html'))
                # Connect to SMTP server
                server = smtplib.SMTP(SERVER_EMAIL, 587)
                server.starttls()
                server.login(settings.SENDER_EMAIL, settings.SENDER_PASSWORD)
                # Send email
                server.sendmail(settings.SENDER_EMAIL,
                                request.email, msg.as_string())
                return OutputResponse.success(code="I0008", msg=I0008)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        finally:
            # Close the connection
            if 'server' in locals():
                # Close the connection
                server.quit()

    def active_user(self, request: ActiveUserRequest, login_user_id: str) -> OutputResponse:
        """
        Active the user
        """
        try:
            # Process the data as needed

            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.user_crud.active_user(
                request.email,
                current_date_time,
                login_user_id)
            # I0002
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def refresh_token(self, refresh_token: str) -> OutputResponse:
        """
        Refresh the token
        """
        try:
            # Refresh the token
            auth_info = self.auth_handler.decode_token(
                refresh_token, token_type="refresh_token")
            if not auth_info:
                return OutputResponse.error(code="E0001", msg=E0001)
            user_valid = UserValid(self.user_crud.db)
            result_user = user_valid.check_user_id_valid(auth_info.id)
            if not result_user:
                return OutputResponse.error(code="E0001", msg=E0001)
            user = {
                "access_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name),
                    TokenInfo("access_token", ACCESS_TOKEN_EXP)),
                "refresh_token": self.auth_handler.encode_token(
                    AuthInfo(result_user.email, result_user.role,
                             result_user.id, result_user.name),
                    TokenInfo("refresh_token", REFRESH_TOKEN_EXP)),
            }
            return OutputResponse.success(data=user)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def check_reset_link(self, hash_key):
        """
        Check the reset link
        """
        try:
            # Accessing data from the request
            result_user = self.user_crud.get_by_password_hash(hash_key)
            if not result_user:
                return OutputResponse.error(code="E0018", msg=E0018)
            current_date_time = datetime.now()
            time_difference = current_date_time - result_user.change_password_dt
            # Check the expiration of the reset link
            # show only message E0017 when the reset link expires > 24h
            if time_difference > timedelta(hours=RESET_LINK_EXP):
                return OutputResponse.error(code="E0017", msg=E0017)
            # Return OK
            user = {
                "user_id": result_user.id,
                "email": result_user.email,
                "name": result_user.name,
                "role": result_user.role
            }
            return OutputResponse.success(data=user)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
