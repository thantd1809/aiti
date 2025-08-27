from typing import List

from app.services.folder import FolderCRUD
from app.utils.response import OutputResponse
from app.services.user import UserCRUD
from app.services.get_data import GetDataCRUD
from app.models.access_control import AccessControlEntry
from app.models.upload import Upload


class GetDataLogic:
    """Logic for getting list of files, folders data by folder_id"""

    def __init__(self, db):
        self.db = db
        self.folder_crud = FolderCRUD(db)
        self.user_crud = UserCRUD(db)
        self.get_data_crud = GetDataCRUD(db)

    def get_my_folders_and_files(self, folder_id, user_id, depart_id):
        """Get list of folders and files by folder_id"""
        try:
            parents_data = []

            if folder_id is None:
                # Get files and folders in root level
                list_folders = self.get_data_crud.get_folder_in_root_my(user_id)
                list_files = self.get_data_crud.get_file_in_root_my(user_id)

            else:
                # Get files and folder in children folder
                check_folder = self.folder_crud.get_by_id(folder_id)

                if check_folder is None:
                    return OutputResponse.error(code="E0002", msg="Folder not found", status_code=404)

                parents_data = self.get_folder_parent_path(folder_id, user_id, depart_id)

                list_folders = self.get_data_crud.get_child_folder_by_folder_id_my(folder_id,user_id)
                list_files = self.get_data_crud.get_child_file_by_folder_id_my(folder_id,user_id)

            folders_data = [
                {"id": f[0], "name": f[1], "created_at": f[2]}
                for f in list_folders
            ]
            files_data = [
                {"id": f[0], "name": f[1], "created_at": f[2], "is_error": f[3]}
                for f in list_files
            ]

            data = {
                "folder_id": folder_id,
                "parent": parents_data,
                "children": {
                    "folders": folders_data,
                    "files": files_data
                }
            }

            return OutputResponse.success(data=data)

        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_shared_folder_and_file(self, user_id, depart_id, folder_id=None):
        """Get shared folder and file by user_id"""
        try:
            # Get list folders and files shared directly
            direct_shared_folder_ids = self.get_direct_shared_folder_ids(user_id, depart_id)
            direct_shared_file_ids = self.get_direct_shared_file_ids(user_id, depart_id)

            if folder_id is None:

                # File and folder in root level
                folders = self.get_data_crud.get_folder_in_root_shared(direct_shared_folder_ids)
                files = self.get_data_crud.get_file_by_file_ids(direct_shared_file_ids)

                parent_path = []

            else:
                accessible_folder_ids = self.get_all_subfolder_ids(direct_shared_folder_ids)

                if folder_id not in accessible_folder_ids:
                    return OutputResponse.error(message="No permission", code=403)

                # Get folder children
                folders = self.get_data_crud.get_child_folder_by_folder_id_shared(folder_id, accessible_folder_ids)
                # Get file in current folder
                files = self.get_data_crud.get_file_by_folder_id(folder_id)

                parent_path = self.get_folder_parent_path(folder_id, user_id, depart_id)

            folder_data = [{"id": f[0], "name": f[1], "created_at": f[2]} for f in folders]
            file_data = [{"id": f[0], "name": f[1], "created_at": f[2]} for f in files]

            return OutputResponse.success(data={
                "folder_id": folder_id,
                "parent": parent_path,
                "children": {
                    "folders": folder_data,
                    "files": file_data
                }
            })

        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_direct_shared_folder_ids(self, user_id, depart_id):
        """Get list of shared folders directly (level root)"""

        return self.get_data_crud.get_folder_ids_in_root_shared(user_id, depart_id)


    def get_direct_shared_file_ids(self, user_id, depart_id):
        """Get list of shared files directly (level root)"""

        return self.get_data_crud.get_file_ids_in_root_shared(user_id, depart_id)

    def get_all_subfolder_ids(self, root_folder_ids):
        """Get all subfolders from shared folders (recursive)"""
        all_ids = set(root_folder_ids)
        queue = list(root_folder_ids)

        while queue:
            current_id = queue.pop(0)
            child_ids = self.get_data_crud.get_child_folder_ids_in_sub_by_folder_id(current_id)

            child_ids = [c[0] for c in child_ids]
            for cid in child_ids:
                if cid not in all_ids:
                    all_ids.add(cid)
                    queue.append(cid)

        return list(all_ids)

    def get_folder_parent_path(self, folder_id, user_id, depart_id):
        """Get path of current folder"""
        try:
            direct_shared_folder_ids = self.get_direct_shared_folder_ids(user_id, depart_id)

            path = []
            current_id = folder_id
            while current_id is not None:
                folder = self.get_data_crud.get_folder_by_folder_id(current_id)

                if folder is None:
                    break

                path.insert(0, {"id": folder.id, "name": folder.name})

                if folder.id in direct_shared_folder_ids:
                    break

                current_id = folder.parent_id

            return path

        except Exception as ex:
            self.db.rollback()
            raise ex    

    def get_all_files_and_folders_by_folder_id(self, user_id,depart_id , folder_id=None):
        """
        Get all folders and files the user upload or shared.
        If folder_id is provided, return all children under that folder (recursively),
        otherwise return all files/folders accessible to the user.
        """
        try:
            # Get folders shared (folder root)
            direct_shared_folder_ids = self.get_direct_shared_folder_ids(user_id, depart_id)
            # Get folders shared (subfolder)
            shared_folder_ids = self.get_all_subfolder_ids(direct_shared_folder_ids)
            # Merge folders shared
            shared_folder_ids = set(shared_folder_ids).union(set(direct_shared_folder_ids))

            # Get owned folders (my folders)
            user_folders = self.get_data_crud.get_folder_by_user_id_my(user_id)
            user_folder_ids = {f[0] for f in user_folders}

            # Merge folders (my + shared)
            accessible_folder_ids = user_folder_ids.union(shared_folder_ids)

            if folder_id:
                # Check permission
                if folder_id not in accessible_folder_ids:
                    return OutputResponse.error(code="E0003", msg="No permission to access this folder", status_code=403)

                # Get all subfolders recursively
                all_subfolder_ids = self.get_all_subfolder_ids([folder_id])
                all_subfolder_ids.append(folder_id)

                # Filter to only accessible ones
                accessible_subfolder_ids = [fid for fid in all_subfolder_ids if fid in accessible_folder_ids]

                # Query folders & files
                folders = self.get_data_crud.get_folder_in_root_shared(accessible_subfolder_ids)
                files = self.get_data_crud.get_file_in_root_sub_by_folder_ids_shared(accessible_subfolder_ids)

            else:
                # Get folders shared
                shared_folders = self.get_data_crud.get_folder_in_root_shared(shared_folder_ids)

                # Get files uploaded (my files)
                user_files = self.get_data_crud.get_file_by_user_id_my(user_id)

                # Get files in folders shared (lấy tất cả các file trong tất cả folder đc share kể cả sub và root)
                shared_files_in_folders = self.get_data_crud.get_file_in_root_sub_by_folder_ids_shared(shared_folder_ids)

                # Get files shared
                shared_file_ids = self.get_direct_shared_file_ids(user_id,depart_id)
                shared_files_direct = self.get_data_crud.get_file_by_file_ids(shared_file_ids)

                folders = user_folders + shared_folders
                files = user_files + shared_files_in_folders + shared_files_direct

            # Remove duplicates
            folder_data = {f[0]: {"id": f[0], "name": f[1], "created_at": f[2], "parent_id": f[3]} for f in folders}
            file_data = {f[0]: {"id": f[0], "name": f[1], "created_at": f[2]} for f in files}

            return OutputResponse.success(data={
                "folder_id": folder_id,
                "folders": list(folder_data.values()),
                "files": list(file_data.values())
            })

        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_all_files_in_folder_and_sub_folder(self, folder_id: List[str]) -> List[str]:
        """
        Get all file IDs in a folder and its subfolders.
        Args:
            folder_id (int): The ID of the folder to search in.
        Returns:
            List[int]: A list of file IDs found in the folder and its subfolders.   
        """
        try:
            # Get all subfolder IDs recursively
            subfolder_ids = self.get_all_subfolder_ids(folder_id)
            subfolder_ids.extend(folder_id)  # Include the root folder itself

            # Get all files in these folders
            files = self.get_data_crud.get_file_in_root_sub_by_folder_ids_shared(subfolder_ids)

            # Extract file IDs
            file_ids = [f[0] for f in files]

            return file_ids
            

        except Exception as ex:
            raise ex

    def get_all_accessible_files(self, user_id: str) -> List[str]:
        """get all file_id that user_id has permission to see"""
        files_ids = []
        owned_files = (
            self.db.query(Upload.id).filter(Upload.created_by == user_id).all()
        )
        files_ids.extend([f[0] for f in owned_files])
        shared_files = (
            self.db.query(AccessControlEntry.file_id)
            .filter(AccessControlEntry.user_id == user_id)
            .all()
        )
        files_ids.extend([f[0] for f in shared_files])
        shared_folder_ids = (
            self.db.query(AccessControlEntry.folder_id)
            .filter(AccessControlEntry.user_id == user_id)
            .all()
        )

        shared_file_in_folder = self.get_all_files_in_folder_and_sub_folder(
            [f[0] for f in shared_folder_ids]
        )
        files_ids.extend(shared_file_in_folder)

        return set(files_ids)  