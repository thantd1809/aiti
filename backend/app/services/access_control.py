from app.services.base import CommonCRUD
from app.models.access_control import AccessControlEntry
from sqlalchemy import delete, or_, update, and_

class AccessControlCRUD(CommonCRUD):
    """CRUD class for AccessControl model"""

    def bulk_create(self, models: list[AccessControlEntry]):
        """Create news accesscontrol"""
        try:
            self.db.bulk_save_objects(models)
            self.db.commit()
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def bulk_delete_user(self, file_id=None, folder_id=None, user_ids=[]):
        """Delete users accesscontrol"""
        try:
            conditions = [AccessControlEntry.user_id.in_(user_ids)]
            if file_id:
                conditions.append(AccessControlEntry.file_id == file_id)
            if folder_id:
                conditions.append(AccessControlEntry.folder_id == folder_id)
            stmt = delete(AccessControlEntry).where(and_(*conditions))
            self.db.execute(stmt)
            self.db.commit()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def bulk_delete_depart(self, file_id=None, folder_id=None, depart_ids=[]):
        """Delete departs accesscontrol"""
        try:
            conditions = [AccessControlEntry.department_id.in_(depart_ids)]
            if file_id:
                conditions.append(AccessControlEntry.file_id == file_id)
            if folder_id:
                conditions.append(AccessControlEntry.folder_id == folder_id)
            stmt = delete(AccessControlEntry).where(and_(*conditions))
            self.db.execute(stmt)
            self.db.commit()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def update(self, id, user_id, description,department_id,permission_type_id, current_date_time, login_user_id):
        """Update the accesscontrol"""
        try:
            stmt = (
                update(AccessControlEntry)
                .values(
                    # code=code,
                    description=description,
                    updated_by=login_user_id,
                    updated_at=current_date_time
                )
                .where(AccessControlEntry.id == id)
                .where(AccessControlEntry.delete_flag == 0)
            )
            self.db.execute(stmt)
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def delete(self, file_id=None, folder_id=None, user_id=None, depart_id=None):
        try:
            stmt = delete(AccessControlEntry)
            if file_id is not None:
                stmt = stmt.where(AccessControlEntry.file_id == file_id)
            if folder_id is not None:
                stmt = stmt.where(AccessControlEntry.folder_id == folder_id)
            if user_id is not None:
                stmt = stmt.where(AccessControlEntry.user_id == user_id)
            if depart_id is not None:
                stmt = stmt.where(AccessControlEntry.department_id == depart_id)

            self.db.execute(stmt)
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex


    def get_by_id(self, id: str):
        """Get accesscontrol by id"""
        try:
            return (
                self.db.query(AccessControlEntry)
                .filter(
                    AccessControlEntry.id == id, AccessControlEntry.delete_flag == 0
                )
                .first()
            )
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_list_user_depart_by_id(self, file_id, folder_id, user_id):
        """Get list of user_ids and department_ids for a given file or folder shared by user_id."""
        try:
            query = self.db.query(
                AccessControlEntry.id,
                AccessControlEntry.user_id,
                AccessControlEntry.department_id,
            ).filter(AccessControlEntry.created_by == user_id)

            if folder_id:
                query = query.filter(AccessControlEntry.folder_id == folder_id)
            elif file_id:
                query = query.filter(AccessControlEntry.file_id == file_id)
            else:
                return {"users": [], "departments": []}

            results = query.all()

            users = []
            departments = []

            for r in results:
                if r.user_id is not None:
                    users.append({"id": r.id, "user_id": r.user_id})
                if r.department_id is not None:
                    departments.append({"id": r.id, "department_id": r.department_id})

            return {"users": users, "departments": departments}

        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_list_user_ids_by_file_id(self, file_id):
        """Get list user_id by file_id"""
        a = (
            self.db.query(AccessControlEntry.user_id)
            .filter(AccessControlEntry.file_id == file_id)
            .all()
        )
        list = [item[0] for item in a if item[0] is not None]
        return list

    def get_list_depart_ids_by_file_id(self, file_id):
        """Get list depart_id by file_id"""
        a = (
            self.db.query(AccessControlEntry.department_id)
            .filter(AccessControlEntry.file_id == file_id)
            .all()
        )
        list = [item[0] for item in a if item[0] is not None]
        return list

    def get_list_user_ids_by_folder_id(self, folder_id):
        """Get list user_id by folder_id"""
        a = (
            self.db.query(AccessControlEntry.user_id)
            .filter(AccessControlEntry.folder_id == folder_id)
            .all()
        )
        list = [item[0] for item in a if item[0] is not None]
        return list

    def get_list_depart_ids_by_folder_id(self, folder_id):
        """Get list depart_id by folder_id"""
        a = (
            self.db.query(AccessControlEntry.department_id)
            .filter(AccessControlEntry.folder_id == folder_id)
            .all()
        )
        list = [item[0] for item in a if item[0] is not None]
        return list
