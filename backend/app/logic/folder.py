"""Folder logic module"""

from datetime import datetime
from app.services.folder import FolderCRUD
from app.models.folder import Folder
from app.utils.auth import Auth
from app.utils.response import OutputResponse
from app.core.constants import DATE_FORMAT
from app.core.message import E0012, E0023, I0001, I0002, I0003
from app.schemas.folder import DeleteFoldersRequest, CreateFolderRequest,UpdateFolderRequest


class FolderLogic:
    """Folder logic class"""

    def __init__(self, db):
        self.auth_handle = Auth()
        self.folder_crud = FolderCRUD(db)
        self.db = db

    def is_circular_dependency(self, folder_to_update_id: str, new_parent_id: str) -> bool:
        """
        Check if new_parent_id is a descendant of folder_to_update_id (circular dependency).
        """
        if new_parent_id is None:
            return False

        if new_parent_id == folder_to_update_id:
            return True

        try:
            # Fetch all parent folders
            folders = self.db.query(Folder.id, Folder.parent_id).filter(Folder.delete_flag == 0).all()
            parent_map = {f.id: f.parent_id for f in folders}
            while new_parent_id is not None:
                if new_parent_id == folder_to_update_id:
                    return True
                new_parent_id = parent_map.get(new_parent_id)

            return False
        except Exception as ex:
            self.db.rollback()
            raise ex

    def create(self, request: CreateFolderRequest, user_id: str) -> OutputResponse:
        """Create a new folder"""
        try:
            if request.parent_id:
                check_parent = self.folder_crud.get_by_id(request.parent_id)
                if check_parent is None:
                    return OutputResponse.error(code="E0002", msg="Folder parent not found", status_code=404)
            
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            folder_model = Folder(
                name=request.name,
                parent_id=request.parent_id,
                owner_id=user_id,
                created_at=current_date_time,
                created_by=user_id,
            )
            self.folder_crud.create(folder_model)
            return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def update(self, request: UpdateFolderRequest, user_id: str, id: str) -> OutputResponse:
        """Update the folder"""
        try:
            if id:
                result_folder =self.folder_crud.get_by_id(id)
                if result_folder is None:
                    return OutputResponse.error(code="E0002", msg="Folder parent not found", status_code=404)

            new_parent_id = request.parent_id

            if new_parent_id:
                # Check if the folder is trying to become its own parent
                if id == new_parent_id:
                    return OutputResponse.error(msg="Folder cannot be its own parent.", status_code=404)

                # Check if the new parent folder exists
                parent_folder_check = self.folder_crud.get_by_id(new_parent_id)
                if parent_folder_check is None:
                    return OutputResponse.error(code="E0002", msg="Folder parent not found", status_code=404)
            
                # Check circular
                if self.is_circular_dependency(id,new_parent_id):
                    return OutputResponse.error(msg="Circular dependency detected. Cannot move folder under its own descendant.", status_code=404)
            
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.folder_crud.update(
                id,
                request.name,
                new_parent_id if new_parent_id is not None else None,
                current_date_time,
                user_id
            )
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete(self, user_id:str, id: str)->OutputResponse:
        """Delete a folder"""
        try:
            result_folder = self.folder_crud.get_by_id(id)
            if not result_folder:
                return OutputResponse.error(code="E0002", msg="Folder not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.folder_crud.delete(id, current_date_time, user_id)
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        
    def delete_list(self, folder_ids: list[str], user_id:str)->OutputResponse:
        """Delete a list of folder"""
        try:
            # Accessing data from the request
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.folder_crud.delete_list(
                folder_ids, current_date_time, user_id)
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
