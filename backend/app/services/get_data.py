from operator import or_
from app.models.upload import Upload
from app.models.folder import Folder
from app.models.access_control import AccessControlEntry
from app.services.base import CommonCRUD


class GetDataCRUD(CommonCRUD):
    """CRUD class for Get data model"""

    def get_folder_in_root_my(self, user_id):
        """Get all folders in root level (my drive)"""
        return self.db.query(Folder.id, Folder.name, Folder.created_at)\
            .filter(
                Folder.delete_flag == 0,
                Folder.parent_id.is_(None),
                Folder.created_by == user_id
            ).all()

    def get_file_in_root_my(self, user_id):
        """Get all files in root level (my drive)"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at, Upload.is_error)\
            .filter(
                Upload.delete_flag == 0,
                Upload.folder_id.is_(None),
                Upload.created_by == user_id
            ).all()

    def get_child_folder_by_folder_id_my(self, folder_id, user_id):
        """Get all folders in sub level (my drive)"""
        return self.db.query(Folder.id, Folder.name, Folder.created_at)\
            .filter(
                Folder.delete_flag == 0,
                Folder.parent_id == folder_id,
                Folder.created_by == user_id
            ).all()
    
    def get_child_folder_by_folder_id_shared(self, folder_id, folder_ids):
        """Get all folders in sub level (shared drive)"""
        return self.db.query(Folder.id, Folder.name, Folder.created_at)\
            .filter(
                Folder.delete_flag == 0,
                Folder.parent_id == folder_id,
                Folder.id.in_(folder_ids)
            ).all()

    def get_child_file_by_folder_id_my(self, folder_id, user_id):
        """Get all files in sub level (my drive)"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at, Upload.is_error)\
            .filter(
                Upload.delete_flag == 0,
                Upload.folder_id == folder_id,
                Upload.created_by == user_id
            ).all()

    def get_folder_ids_in_root_shared(self, user_id, depart_id):
        """Get all folders in root level by user_id or depart_id (shared drive)"""
        folder_ids = self.db.query(AccessControlEntry.folder_id)\
            .filter(
                AccessControlEntry.folder_id.isnot(None),
                or_(
                    AccessControlEntry.user_id == user_id,
                    AccessControlEntry.department_id == depart_id
                )
            ).all()
        return [f[0] for f in folder_ids]

    def get_file_ids_in_root_shared(self, user_id, depart_id):
        """Get all files in root level by user_id or depart_id (shared drive)"""
        file_ids = self.db.query(AccessControlEntry.file_id)\
            .filter(
                AccessControlEntry.file_id.isnot(None),
                or_(
                    AccessControlEntry.user_id == user_id,
                    AccessControlEntry.department_id == depart_id
                )
            ).all()
        return [f[0] for f in file_ids]

    def get_folder_by_folder_id(self, folder_id):
        """Get folder inf by folder_id"""
        return self.db.query(Folder.id, Folder.name, Folder.parent_id)\
            .filter(Folder.id == folder_id, Folder.delete_flag == 0).first()

    def get_child_folder_ids_in_sub_by_folder_id(self, folder_id):
        """Get all sub-folder of a folder by folder_id"""
        return self.db.query(Folder.id).filter(
            Folder.parent_id == folder_id,
            Folder.delete_flag == 0
        ).all()

    def get_folder_in_root_shared(self, folder_ids):
        """Get all folders in root level (shared drive)"""
        return self.db.query(Folder.id, Folder.name, Folder.created_at, Folder.parent_id).filter(
            Folder.delete_flag == 0,
            Folder.id.in_(folder_ids)
        ).all()

    def get_folder_by_user_id_my(self, user_id):
        """Get all folders by user_id (my drive)"""
        return self.db.query(Folder.id, Folder.name, Folder.created_at, Folder.parent_id).filter(
            Folder.delete_flag == 0,
            Folder.created_by == user_id
        ).all()

    def get_file_by_user_id_my(self, user_id):
        """Get all files by user_id (my drive)"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at).filter(
            Upload.delete_flag == 0,
            Upload.created_by == user_id
        ).all()

    def get_file_in_root_sub_by_folder_ids_shared(self, folder_ids):
        """Get all files in folders shared (root + sub)"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at).filter(
            Upload.delete_flag == 0,
            Upload.folder_id.in_(folder_ids)
        ).all()

    def get_file_by_file_ids(self, file_ids):
        """Get all files by ids"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at).filter(
            Upload.delete_flag == 0,
            Upload.id.in_(file_ids)
        ).all()
    
    def get_file_by_folder_id(self, folder_id):
        """Get all files in folder by folder_id"""
        return self.db.query(Upload.id, Upload.name, Upload.created_at)\
            .filter(
                Upload.delete_flag == 0,
                Upload.folder_id == folder_id
            ).all()
