from app.services.base import CommonCRUD
from app.models.folder import Folder
from sqlalchemy import update

class FolderCRUD(CommonCRUD):
    """CRUD class for Folder model"""

    def update(self, id, name, parent_id, current_date_time, login_user_id):
        """Update the folder"""
        try:
            stmt = (
                update(Folder)
                .values(
                    name=name,
                    parent_id=parent_id,
                    updated_by=login_user_id,
                    updated_at=current_date_time
                )
                .where(Folder.id == id)
                .where(Folder.delete_flag == 0)
            )
            self.db.execute(stmt)
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def delete(self, id, current_date_time, login_user_id ):
        try:
            update_folder_stmt = (update(Folder).values(
                delete_flag =1,
                updated_by=login_user_id,
                updated_at=current_date_time,
            ).where(Folder.id == id).where(Folder.delete_flag == 0))
            # Execute the update statement
            self.db.execute(update_folder_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def delete_list(self, ids:list[str], current_date_time, login_user_id):
        """Delete list of folders"""
        try:
            update_folder_stmt= (update(Folder).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(Folder.id.in_(ids)).where(Folder.delete_flag==0))
            # Execute the update statement
            self.db.execute(update_folder_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def get_by_id(self, id:str):
        """Get folder by id"""
        try:
            return self.db.query(Folder).filter(Folder.id == id,
                                                Folder.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex
