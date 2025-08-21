from app.services.base import CommonCRUD
from app.models.permission import Permission
from sqlalchemy import update

class PermissionCRUD(CommonCRUD):
    """CRUD class for Permission model"""

    def update(self, id, code, description, current_date_time, login_user_id):
        """Update the permission"""
        try:
            stmt = (
                update(Permission)
                .values(
                    code=code,
                    description=description,
                    updated_by=login_user_id,
                    updated_at=current_date_time
                )
                .where(Permission.id == id)
                .where(Permission.delete_flag == 0)
            )
            self.db.execute(stmt)
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def delete(self, id, current_date_time, login_user_id ):
        try:
            update_permission_stmt = (update(Permission).values(
                delete_flag =1,
                updated_by=login_user_id,
                updated_at=current_date_time,
            ).where(Permission.id == id).where(Permission.delete_flag == 0))
            # Execute the update statement
            self.db.execute(update_permission_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    # def delete_list(self, ids:list[int], current_date_time, login_user_id):
    #     """Delete list of permissions"""
    #     try:
    #         update_permission_stmt= (update(Permission).values(
    #             delete_flag=1,
    #             updated_by=login_user_id,
    #             updated_at=current_date_time
    #         ).where(Permission.id.in_(ids)).where(Permission.delete_flag==0))
    #         # Execute the update statement
    #         self.db.execute(update_permission_stmt)

    #         # Commit the changes to the database
    #         self.db.commit()
    #         return 1
    #     except Exception as ex:
    #         self.db.rollback()
    #         raise ex
        
    def get_by_id(self, id:str):
        """Get permission by id"""
        try:
            return self.db.query(Permission).filter(Permission.id == id,
                                                Permission.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex
