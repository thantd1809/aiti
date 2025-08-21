from typing import Optional
from fastapi import APIRouter, Depends, Security
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.folder import DeleteFoldersRequest, CreateFolderRequest,UpdateFolderRequest
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import FOLDER, ADMIN_ROLE
from app.logic.folder import FolderLogic
from app.logic.get_data import GetDataLogic
from app.logic.ingest_logic import IngestLogic
from app.logic.upload import UploadLogic

auth_handler = Auth
security = HTTPBearer()
folder_route = APIRouter()

@folder_route.get('/folder/my', tags=[FOLDER])
async def get_data(
    folder_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)):
    try:
        user = BaseApi(credentials.credentials).verify(db)
        data_logic = GetDataLogic(db)
        response = data_logic.get_my_folders_and_files(folder_id, user.id, user.department_id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    
@folder_route.get('/folder/shared', tags=[FOLDER])
async def get_data_shared(
    folder_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)):
    try:
        user = BaseApi(credentials.credentials).verify(db)
        data_logic = GetDataLogic(db)
        response = data_logic.get_shared_folder_and_file(user.id, user.department_id, folder_id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))

@folder_route.get('/folder/all', tags=[FOLDER])
async def get_all_data_upload_shared_by_folder_id(
    folder_id: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)):
    try:
        user = BaseApi(credentials.credentials).verify(db)
        data_logic = GetDataLogic(db)
        response = data_logic.get_all_files_and_folders_by_folder_id(user.id,user.department_id, folder_id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    
@folder_route.post('/folder', tags=[FOLDER])
async def folders(request:CreateFolderRequest,
                  credentials: HTTPAuthorizationCredentials = Security(security),
                    db: Session = Depends(get_db)):
    """Create folder API endpoint"""
    try:
       user = BaseApi(credentials.credentials).verify(db)
       folder_logic = FolderLogic(db)
       response = folder_logic.create(request, user.id)
       return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    
@folder_route.put('/folder/{id}', tags=[FOLDER])
async def update_folder(id:str, request:UpdateFolderRequest,
                        credentials: HTTPAuthorizationCredentials = Security(security),
                        db: Session = Depends(get_db)):
    """Update folder API endpoint"""
    try:
        folder_logic = FolderLogic(db)
        user = BaseApi(token=credentials.credentials).verify(db)
        response = folder_logic.update(request, user.id, id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
    
@folder_route.delete('/folder/{id}', tags=[FOLDER])
async def delete_folder(id:str,
                        credentials: HTTPAuthorizationCredentials = Security(security),
                        db: Session = Depends(get_db)):
    """Delete a folder by ids API endpoint"""
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        folder_logic = FolderLogic(db)
        response = folder_logic.delete(user.id, id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))

@folder_route.delete('/folder', tags=[FOLDER])
async def delete_folder_list(request: DeleteFoldersRequest,
                        credentials: HTTPAuthorizationCredentials = Security(security),
                        db: Session = Depends(get_db)):
    """Delete folder list by ids API endpoint"""
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        if user.role != ADMIN_ROLE:
            return OutputResponse.error(code="E0001", msg="Unauthorized")
        # Get all files in the folders to delete them from vector store and record manager
        data_logic = GetDataLogic(db)
        all_file_in_folder = data_logic.get_all_files_in_folder_and_sub_folder(request.folder_ids)
        # Get folder children in folder
        all_folder_children = data_logic.get_all_subfolder_ids(request.folder_ids)
        all_folder = all_folder_children + request.folder_ids
        # Delete from vector store and record manager
        ingest_docs_logic = IngestLogic()
        ingest_docs_logic.delete(file_ids=all_file_in_folder)
        # Delete files from the database
        upload_logic = UploadLogic(db)
        upload_logic.delete(all_file_in_folder, user.id)
        # Delete folders from the database
        folder_logic = FolderLogic(db)
        response = folder_logic.delete_list(all_folder, user.id)
        return response
    except Exception as ex:
        return OutputResponse.error(msg=str(ex))
