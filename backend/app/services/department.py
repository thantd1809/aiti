from app.services.base import CommonCRUD
from app.models.department import Department
from sqlalchemy import update
from app.models.user import User


class DepartmentCRUD(CommonCRUD):
    """CRUD class for Department model"""

    def update(self, id, name, parent_id, current_date_time, login_user_id):
        """Update the department"""
        try:
            stmt = (
                update(Department)
                .values(
                    name=name,
                    parent_id=parent_id,
                    updated_by=login_user_id,
                    updated_at=current_date_time
                )
                .where(Department.id == id)
                .where(Department.delete_flag == 0)
            )

            self.db.execute(stmt)
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def delete(self, id, current_date_time, login_user_id):
        """Delete a list of department"""
        try:
            update_depart_stmt = (update(Department).values(
                delete_flag =1,
                updated_by=login_user_id,
                updated_at=current_date_time,
            ).where(Department.id == id).where(Department.delete_flag==0))
            
            # Execute the update statement
            self.db.execute(update_depart_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def get_by_id(self, id:str):
        """Get a department by id"""
        try:
            return self.db.query(Department).filter(Department.id == id,
                                                    Department.delete_flag == 0).first()
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def list_and_sort(self, search: str = None, page: int = 1, limit: int = 10):
        """Get a list off department and sort them"""
        try:

            # Define the conditions
            conditions = (Department.delete_flag == 0)
            if search:
                conditions = conditions & (
                    Department.name.ilike(f"%{search}%"))

            # Query to get imported file information
            depart_list = (
                self.db.query(Department)
                .filter(conditions)
            )
            total = depart_list.count()
            depart_list = depart_list.offset(
                (page - 1) * limit).limit(limit).all()
            return depart_list, total
        except Exception as ex:
            self.db.rollback()
            raise ex
        
    def get_all_user_by_depart_id(self, id: str):
        """Get department info and its users"""
        try:
            department = self.db.query(Department).filter(
                Department.id == id,
                Department.delete_flag == 0
            ).first()

            if not department:
                return None

            users = self.db.query(User.id, User.name, User.email).filter(
                User.department_id == id,
                User.delete_flag == 0
            ).all()

            return {
                "id": department.id,
                "name": department.name,
                "users": [{"id": u.id, "name": u.name, "email": u.email} for u in users]
            }

        except Exception as ex:
            self.db.rollback()
            raise ex

