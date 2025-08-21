"""Department logic module"""

from datetime import datetime
from app.services.department import DepartmentCRUD
from app.models.department import Department
from app.utils.auth import Auth
from app.utils.response import OutputResponse
from app.core.constants import DATE_FORMAT
from app.core.message import E0012, E0023, I0001, I0002, I0003
from app.schemas.department import CreateDepartmentRequest,UpdateDepartmentRequest


class DepartmentLogic:
    """Department logic class"""

    def __init__(self, db):
        self.auth_handle = Auth()
        self.department_crud = DepartmentCRUD(db)

    def get(self, id):
        """Get department by id"""
        try:
            result_depart = self.department_crud.get_by_id(id)
            if not result_depart:
                return OutputResponse.error(code="E0002", msg="Department not found", status_code=404)
            depart = {
                "id" : result_depart.id,
                "name" : result_depart.name,
                "parent_id" : result_depart.parent_id
            }
            return OutputResponse.success(data=depart)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex)) 
        
    def get_all(self, search: str = None, page: int = 1, limit: int = 10):
        """Get all department with optional search, pagination"""
        try:
            # Process the data as needed
            list_depart, total = self.department_crud.list_and_sort(
                search, page, limit)
            departs = [
                {
                    "id" : item.id,
                    "name" : item.name,
                    "parent_id" : item.parent_id
                }
                for item in list_depart
            ]
            data = {
                "departs": departs,

            }
            return OutputResponse.success_with_pagination(data=data, page=page, limit=limit, total=total)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
            
    def create(self, request: CreateDepartmentRequest, user_id: str) ->OutputResponse:
        """Create a new department"""
        try:
            if request.parent_id:
                check_parent = self.department_crud.get_by_id(request.parent_id)
                if check_parent is None:
                    return OutputResponse.error(code="E0002", msg="Department parent not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            department_model = Department(
                name=request.name,
                parent_id=request.parent_id,
                created_at=current_date_time,
                created_by=user_id
            )

            self.department_crud.create(department_model)
            return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        
    def update(self, request: UpdateDepartmentRequest, user_id: str, id: str) -> OutputResponse:
        """Update the department"""
        try:
            result_depart = self.department_crud.get_by_id(id)
            if not result_depart:
                return OutputResponse.error(code="E0002", msg="Department not found")
            
            # Verify parent_id if !=null
            if request.parent_id is not None:
                if request.parent_id == id:
                    return OutputResponse.error(code="E0003", msg="Department cannot be its own parent", status_code=400)

                check_parent = self.department_crud.get_by_id(request.parent_id)
                if check_parent is None:
                    return OutputResponse.error(code="E0005", msg="Parent_id not found")
                
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.department_crud.update(
                id,
                request.name,
                request.parent_id,
                current_date_time,
                user_id
            )
            
            return OutputResponse.success(code="I0002", msg=I0002)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete(self, user_id : str, id:str)->OutputResponse:
        """Delete a department"""
        try:
            result_depart = self.department_crud.get_by_id(id)
            if not result_depart:
                return OutputResponse.error(code="E0002", msg="Department not found", status_code=404)
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            self.department_crud.delete(id, current_date_time, user_id)
            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
        
    def get_user_in_dept_id(self, id: str):
        """Get all users by department id"""
        try:
            result_depart = self.department_crud.get_by_id(id)
            if not result_depart:
                return OutputResponse.error(code="E0002", msg="Department not found", status_code=404)
            data = self.department_crud.get_all_user_by_depart_id(id)
            return OutputResponse.success(data=data)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))
