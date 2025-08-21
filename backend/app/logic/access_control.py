"""Access control logic module"""

from datetime import datetime

from app.services.access_control import AccessControlCRUD
from app.models.access_control import AccessControlEntry
from app.services.upload import UploadCRUD
from app.services.notifications import NotificationBadgeCRUD, NotificationCRUD
from app.services.folder import FolderCRUD
from app.utils.auth import Auth
from app.utils.response import OutputResponse
from app.core.constants import DATE_FORMAT
from app.core.message import I0009
from app.schemas.access_control import EditAccessControlRequest
from app.models.notification import Notification

class AccessControlLogic:
    """logic class"""

    def __init__(self, db):
        self.auth_handle = Auth()
        self.permission_crud = AccessControlCRUD(db)
        self.file_crud = UploadCRUD(db)
        self.notification_crud = NotificationCRUD(db)
        self.folder_crud = FolderCRUD(db)
        self.db = db

    def get(self, file_id: str, folder_id: str, user_id: str) -> OutputResponse:
        """Get list of user_ids and depart_ids by file or folder id"""
        try:
            # Add verify, only 1 file or 1 folder id (future)
            data = self.permission_crud.get_list_user_depart_by_id(
                file_id, folder_id, user_id
            )
            return OutputResponse.success(data=data)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def edit_access_control(self, request: EditAccessControlRequest, user_id):
        """Edit access_control of file/folder"""
        try:
            current_date_time = datetime.now().strftime(DATE_FORMAT)

            if request.file_id:
                upload_file = self.file_crud.get_by_id(request.file_id)
                if not upload_file:
                    return OutputResponse.error(msg="File not found")
                list_new_user = set(request.user_ids or [])
                list_new_depart = set(request.depart_ids or [])

                if request.user_ids is not None:
                    list_old_user = set(
                        self.permission_crud.get_list_user_ids_by_file_id(request.file_id)
                    )

                    ids_add = list(list_new_user - list_old_user)
                    ids_del = list(list_old_user - list_new_user)
                    
                    if ids_add:
                        models_add = [
                            AccessControlEntry(
                                user_id=uid,
                                file_id=request.file_id,
                                # permission_type_id=request.permission_type_id,
                                created_at=current_date_time,
                                created_by=user_id,
                            )
                            for uid in ids_add
                        ]
                        self.permission_crud.bulk_create(models_add)
                        # Exclude the sharing user from notifications
                        notify_user_ids = [uid for uid in ids_add if uid != user_id]
                        for notify_uid in notify_user_ids:
                            self.notification_crud.create(
                                Notification(
                                    title="File Shared",
                                    user_id=notify_uid,
                                    file_id=request.file_id,
                                    created_by=user_id,
                                    created_at=current_date_time,
                                    content=f"File '{upload_file.name}' has been shared with you."
                                )
                            )
                            NotificationBadgeCRUD(self.db).update_badge(
                                user_id=notify_uid,
                                last_notification_dt= current_date_time
                            )

                    if ids_del:
                        self.permission_crud.bulk_delete_user(
                            file_id=request.file_id, user_ids=ids_del
                        )

                if request.depart_ids is not None:
                    list_old_depart = set(
                        self.permission_crud.get_list_depart_ids_by_file_id(request.file_id)
                    )

                    ids_add = list(list_new_depart - list_old_depart)
                    ids_del = list(list_old_depart - list_new_depart)
                    if ids_add:
                        models_add = [
                            AccessControlEntry(
                                department_id=did,
                                file_id=request.file_id,
                                # permission_type_id=request.permission_type_id,
                                created_at=current_date_time,
                                created_by=user_id,
                            )
                            for did in ids_add
                        ]
                        self.permission_crud.bulk_create(models_add)

                    if ids_del:
                        self.permission_crud.bulk_delete_depart(
                            file_id=request.file_id, depart_ids=ids_del
                        )

            if request.folder_id:
                list_new_user = set(request.user_ids or [])
                list_new_depart = set(request.depart_ids or [])
                folder_instance = self.folder_crud.get_by_id(request.folder_id)
                if not folder_instance:
                    return OutputResponse.error(msg="Folder not found")

                if request.user_ids is not None:
                    list_old_user = set(
                        self.permission_crud.get_list_user_ids_by_folder_id(request.folder_id)
                    )

                    ids_add = list(list_new_user - list_old_user)
                    ids_del = list(list_old_user - list_new_user)
                    if ids_add:
                        models_add = [
                            AccessControlEntry(
                                user_id=uid,
                                folder_id=request.folder_id,
                                # permission_type_id=request.permission_type_id,
                                created_at=current_date_time,
                                created_by=user_id,
                            )
                            for uid in ids_add
                        ]
                        # Exclude the sharing user from notifications
                        notify_user_ids = [uid for uid in ids_add if uid != user_id]
                        for notify_uid in notify_user_ids:
                            self.notification_crud.create(
                                Notification(
                                    title="Folder Shared",
                                    user_id=notify_uid,
                                    folder_id=request.folder_id,
                                    created_by=user_id,
                                    created_at=current_date_time,
                                    content=f"Folder '{folder_instance.name}' has been shared with you."
                                )
                            )
                            NotificationBadgeCRUD(self.db).update_badge(
                                user_id=notify_uid,
                                last_notification_dt=current_date_time
                            )
                        self.permission_crud.bulk_create(models_add)

                    if ids_del:
                        self.permission_crud.bulk_delete_user(
                            folder_id=request.folder_id, user_ids=ids_del
                        )

                if request.depart_ids is not None:
                    list_old_depart = set(
                        self.permission_crud.get_list_depart_ids_by_folder_id(request.folder_id)
                    )

                    ids_add = list(list_new_depart - list_old_depart)
                    ids_del = list(list_old_depart - list_new_depart)
                    if ids_add:
                        models_add = [
                            AccessControlEntry(
                                department_id=did,
                                folder_id=request.folder_id,
                                # permission_type_id=request.permission_type_id,
                                created_at=current_date_time,
                                created_by=user_id,
                            )
                            for did in ids_add
                        ]
                        self.permission_crud.bulk_create(models_add)

                    if ids_del:
                        self.permission_crud.bulk_delete_depart(
                            folder_id=request.folder_id, depart_ids=ids_del
                        )

            return OutputResponse.success(code="I0009", msg=I0009)

        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

