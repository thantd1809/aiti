"""The validation department"""

from app.services.department import DepartmentCRUD

class DepartmentValid:
    def __init__(self,db):
        self.department_crud = DepartmentCRUD(db)

