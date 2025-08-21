from sqlalchemy import or_, update, delete, and_

from app.models.upload import Upload
from app.services.base import CommonCRUD
from app.core.constants import IMPORTED_EMBEDDING_STATUS
from app.core.constants import RESERVED_EMBEDDING_STATUS
from app.models.access_control import AccessControlEntry
from app.models.user import User


class UploadCRUD(CommonCRUD):
    """
    CRUD class for the Upload model
    """

    def get_by_name(self, objects_name: str):
        """
        Get a user by objects name
        """
        try:
            return self.db.query(Upload).filter(Upload.objects_name == objects_name,
                                                Upload.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def delete(self, id, current_date_time, login_user_id):
        """
        Delete a file upload by the user
        """
        try:
            # Update the fields
            update_stmt = (update(Upload).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(Upload.id == id, Upload.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def delete_hard(self, id):
        """
        Delete hard a file upload
        """
        try:
            # Update the fields
            update_stmt = (delete(Upload).where(
                Upload.id == id, Upload.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def list_and_sort(self, user_id: str, search: str = None):
        """Get all file with permission"""
        try:
            # get depart of user
            user_department = self.db.query(User.department_id).filter(User.id == user_id).scalar()

            # query file
            file_permissions = (
                self.db.query(Upload)
                .join(AccessControlEntry, AccessControlEntry.file_id == Upload.id)
                .filter(
                    Upload.delete_flag == 0,
                    or_(
                        AccessControlEntry.permission_type_id == 1,
                        Upload.created_by == user_id
                    ),
                    or_(
                        AccessControlEntry.user_id == user_id,
                        AccessControlEntry.department_id == user_department,
                        Upload.created_by == user_id
                    )
                )
            )

            # query folder
            folder_permissions = (
                self.db.query(Upload)
                .join(AccessControlEntry, AccessControlEntry.folder_id == Upload.folder_id)
                .filter(
                    Upload.delete_flag == 0,
                    or_(
                        AccessControlEntry.permission_type_id == 1,
                        Upload.created_by == user_id
                    ),
                    or_(
                        AccessControlEntry.user_id == user_id,
                        AccessControlEntry.department_id == user_department,
                        Upload.created_by == user_id
                    )
                )
            )

            # merge both (union will delete if duplicate)
            query = file_permissions.union(folder_permissions)

            if search:
                query = query.filter(Upload.name.ilike(f"%{search}%"))

            upload_list = query.order_by(Upload.created_at.desc()).all()

            return upload_list

        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_ids(self, ids: list):
        """
        Get a list of file upload by the provided list of IDs
        """
        try:
            # Query to get a list of IDs based on the provided list
            ids_list = self.db.query(Upload).filter(
                Upload.id.in_(ids),
                Upload.delete_flag == 0).all()
            # Extract the IDs from the list
            return ids_list
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def get_by_id(self, id: str):
        """
        Get a file upload by the provided ID
        """
        try:
            return self.db.query(Upload).filter(
                Upload.id == id,
                Upload.delete_flag == 0).first()
        except Exception as ex:
            raise ex

    def update_is_error(self, file_id: str, is_error: bool):
        """
        Update the is_error field of a file upload
        """
        try:
            update_stmt = (update(Upload).values(
                is_error=is_error
            ).where(Upload.id == file_id, Upload.delete_flag == 0))

            self.db.execute(update_stmt)
            self.db.commit()
        except Exception as ex:
            self.db.rollback()
            raise ex
        
        