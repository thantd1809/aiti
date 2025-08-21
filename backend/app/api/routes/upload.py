from typing import Annotated
from datetime import datetime

from fastapi import APIRouter, Depends, Security, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.utils.auth import Auth
from app.schemas.upload import DeleteUploadRequest
from app.logic.upload import UploadLogic
from app.logic.ingest_logic import IngestLogic
from app.utils.response import OutputResponse
from app.api.routes.base import BaseApi
from app.core.constants import UPLOAD
from app.core.message import I0004, I0010
from app.services.notifications import NotificationCRUD, NotificationBadgeCRUD
from app.schemas.upload import RetryUploadRequest
from app.services.upload import UploadCRUD
from app.core.constants import DATE_FORMAT
from app.models.notification import Notification
from app.models.upload import Upload
from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_handler = Auth
security = HTTPBearer()
upload_route = APIRouter()


def run_embedding_in_background(file_id: str, file_extension: str, user_id: str, file_name: str, url: str):
    """
    Function to run embedding process in background
    """
    try:
        ingest_logic = IngestLogic()
        file_path = f"{file_id}.{file_extension}"
        ingest_logic.ingest_doc(file_path=file_path,
                                file_id=file_id, user_id=user_id, file_name=file_name, url=url)
    except Exception as ex:
        # Log error but don't raise it since this is running in background
        logger.error(f"Error in background embedding process: {ex}")
        # Update is_error field in upload file
        db = next(get_db())
        UploadCRUD(db).update_is_error(file_id=file_id, is_error=True)
        dt = datetime.now().strftime(DATE_FORMAT)
        
        # Create notification for user
        NotificationCRUD(db).create(
            Notification(
            user_id=user_id,
            file_id=file_id,
            created_by=user_id,
            created_at=dt,
            content="Embedding failed for file: {}".format(file_name),
            title="Embedding Error"
            )
        )
        NotificationBadgeCRUD(db).update_badge(user_id=user_id, last_notification_dt=dt)


def run_embedding_in_background_retry(instance: Upload, user_id: str = None):
    """
    Function to run embedding process in background for retry
    """
    try:
        file_path = f"{instance.id}.{instance.file_extension}"
        ingest_logic = IngestLogic()
        ingest_logic.ingest_doc(file_path=file_path,
                                file_id=instance.id, user_id=user_id, file_name=instance.name, url=instance.url)
        instance.is_error = False
        db = next(get_db())
        UploadCRUD(db).update_is_error(instance.id, is_error=False)
    except Exception as ex:
        # Log error but don't raise it since this is running in background
        logger.error(f"Error in background embedding process: {ex}")


@upload_route.post('/upload', tags=[UPLOAD])
async def upload(background_tasks: BackgroundTasks,
                 file: UploadFile = File(...),
                 folder_id: Annotated[str, Form()] = None,
                 credentials: HTTPAuthorizationCredentials = Security(
                     security),
                 db: Session = Depends(get_db)):
    """
    Store infos for the file upload from S3 API endpoint.
    Returns immediately and runs embedding process in the background.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        file_content = await file.read()
        file_ext = file.filename.split('.')[-1]
        upload_logic = UploadLogic(db)
        instance, err = upload_logic.upload(
            user=user,
            file=file.file,
            file_name=file.filename,
            file_size=str(len(file_content)),
            file_extension=file_ext,
            content_type=file.content_type,
            folder_id=folder_id,
        )
        if err != None:
            return OutputResponse.error(msg=str(err))

        # Add embedding task to run in background after returning response
        background_tasks.add_task(
            run_embedding_in_background, instance.id, instance.file_extension, user.id, instance.name, instance.url)

        return OutputResponse.success(code=I0004, msg=I0004)
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))



@upload_route.delete('/upload', tags=[UPLOAD])
async def upload(request: DeleteUploadRequest,
                 credentials: HTTPAuthorizationCredentials = Security(
                     security),
                 db: Session = Depends(get_db)):
    """
    Delete a file upload from S3 and under DB API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        upload_logic = UploadLogic(db)
        ingest_docs_logic = IngestLogic()
        # Delete from vector store and record manager
        ingest_docs_logic.delete(file_ids=request.file_ids)
        response = upload_logic.delete(request.file_ids, user.id)
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))


@upload_route.get('/upload', tags=[UPLOAD])
async def upload(credentials: HTTPAuthorizationCredentials = Security(security),
                 db: Session = Depends(get_db),
                 search: str = None):
    """
    Get all file upload API endpoint.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        upload_logic = UploadLogic(db)
        response = upload_logic.get_all(user_id=user.id,
                                        search=search,
        )
        return response
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))

@upload_route.post('/upload/retry', tags=[UPLOAD])
async def retry_upload(
        background_tasks: BackgroundTasks,
        request: RetryUploadRequest,
        credentials: HTTPAuthorizationCredentials = Security(
            security),
        db: Session = Depends(get_db)
    ):
    """
    Retry a failed file upload.
    """
    try:
        user = BaseApi(token=credentials.credentials).verify(db)
        upload_logic = UploadLogic(db)
        instance = upload_logic.get_file_by_id(request.file_id)
        if not instance or instance.is_error is False:
            return OutputResponse.error(msg="File not found")
        background_tasks.add_task(
            run_embedding_in_background_retry, instance, user.id)
        return OutputResponse.success(code=I0010, msg=I0010)
    except Exception as ex:
        # Catch any other unexpected exceptions
        # return ex
        return OutputResponse.error(msg=str(ex))
