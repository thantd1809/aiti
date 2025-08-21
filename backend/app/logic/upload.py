"""
Upload logic module
"""
import io
import os
from datetime import datetime
from typing import Union, BinaryIO, List
from tempfile import SpooledTemporaryFile

from minio import Minio
from uuid import uuid4

from app.logic.ingest_logic import IngestLogic
from app.utils.response import OutputResponse
from app.services.upload import UploadCRUD
from app.schemas.upload import DeleteUploadRequest
from app.models.upload import Upload
from app.core.constants import DATE_FORMAT
from app.core.config import settings
from app.core.message import E0024, I0001, I0003
from app.core.logger import logging
from app.models.user import User
from app.services.folder import FolderCRUD


logger = logging.getLogger(__name__)
BUCKET_NAME = settings.MINIO_BUCKET
MINIO_URL = settings.MINIO_URL_ACCESS
MINIO_ACCESS_KEY = settings.MINIO_ACCESS_KEY
MINIO_SECRET_KEY = settings.MINIO_SECRET_KEY


class UploadLogic:
    """
    Upload logic class
    """

    def __init__(self, db):
        self.upload_crud = UploadCRUD(db)
        self.ingest_logic = IngestLogic
        self.folder_crud = FolderCRUD(db)

        # Create a Minio S3 client
        self.s3 = Minio(
            endpoint=settings.MINIO_URL,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )

    def delete_file_s3(self, file_key):
        """
        Delete a file from S3
        """
        try:
            # Delete the file from S3
            self.s3.remove_object(
                bucket_name=BUCKET_NAME,
                object_name=file_key
            )
            return True
        except Exception as ex:
            raise ex


    def upload(self, user: User, file: Union[bytes, BinaryIO], file_name: str, file_size: str, file_extension: str, content_type: str, folder_id: str):
        """
        Upload file to MinIO with folder path based on folder_id
        """
        try:
            id = uuid4()
            object_key = f"{id}.{file_extension}"

            # Prepare file
            if isinstance(file, bytes):
                file_size = len(file)
                file = io.BytesIO(file)
            elif isinstance(file, BinaryIO):
                file.seek(0, os.SEEK_END)
                file_size = file.tell()
                file.seek(0)
            elif isinstance(file, SpooledTemporaryFile):
                file_size = file.tell()
                file.seek(0)

            # Upload to MinIO
            self.s3.put_object(
                bucket_name=BUCKET_NAME,
                object_name=object_key,
                data=file,
                length=int(file_size),
                content_type=content_type
            )
            # Get link to the uploaded file
            file_url = f"{MINIO_URL}/{BUCKET_NAME}/{object_key}"

            # Save to DB
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            upload_model = Upload(
                id=str(id),
                name=file_name,
                created_at=current_date_time,
                created_by=user.id,
                file_extension=file_extension,
                file_size=file_size,
                folder_id=folder_id,
                url=file_url
            )
            return self.upload_crud.create(upload_model)

        except Exception as ex:
            return None, str(ex)

    def embedding(self, user_login_id: str):
        """
        Embedding upload files to the vector table(embedding now & monthly)
        """
        try:
            # Process the data as needed
            current_date_time = datetime.now().strftime(DATE_FORMAT)
            uploaded_files = self.upload_crud.get_files_to_embedding(
                current_date_time)
            if not uploaded_files:
                return OutputResponse.error(code="E0024", msg=E0024)

            # For each file, associate it with the user who triggered the embedding
            for file in uploaded_files:
                file.user_id = user_login_id

            # "incremental", "full"
            response = self.ingest_logic.ingest_docs(
                uploaded_files, cleanup="full", user_id=user_login_id)
            if response:
                for result in uploaded_files:
                    self.upload_crud.update_embedding_status(
                        result.id,
                        current_date_time,
                        user_login_id)
                # I0001
                return OutputResponse.success(code="I0001", msg=I0001)
        except Exception as ex:
            if uploaded_files:
                # Delete vectordb(embedding) and record_manager
                self.ingest_logic.delete()
            return OutputResponse.error(msg=str(ex))

    def delete(self, file_ids: List[str], user_id: str) -> OutputResponse:
        """
        Delete the uploaded file
        """
        try:
            # Fetch all required records in a single query to reduce database calls
            upload_files = self.upload_crud.get_by_ids(file_ids)

            # Process the data as needed
            for upload_file in upload_files:
                file_name = f"{upload_file.id}.{upload_file.file_extension}"
                response = self.delete_file_s3(file_name)
                if response:
                    current_date_time = datetime.now().strftime(DATE_FORMAT)
                    self.upload_crud.delete(
                        upload_file.id,
                        current_date_time,
                        user_id)

            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def delete_hard(self, file_ids: List[str]) -> OutputResponse:
        """
        Delete hard the uploaded file
        """
        try:
            # Fetch all required records in a single query to reduce database calls
            upload_files = self.upload_crud.get_by_ids(file_ids)

            # Process the data as needed
            for upload_file in upload_files:
                response = self.delete_file_s3(upload_file.objects_name)
                if response:
                    self.upload_crud.delete_hard(upload_file.id)

            return OutputResponse.success(code="I0003", msg=I0003)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get_all(self, user_id: str, search: str):
        """
        Get all uploaded files
        """
        try:
            # Process the data as needed
            upload_files = self.upload_crud.list_and_sort(
                user_id=user_id, search=search)
            uploads = [
                {
                    'id': item.id,
                    "objects_name": item.name,
                    "url" : item.url
                }
                for item in upload_files
            ]
            return OutputResponse.success_with_pagination(data=uploads)
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def embedding_file(self, file_name: str, file_id: str):
        """
        Embedding the uploaded file right after uploading.
        """
        try:
            # Ingest the document
            response = self.ingest_logic.ingest_doc(
                self, upload_file_id=file_id, docs=file_name)
            if response:
                return OutputResponse.success(code="I0001", msg=I0001)
            else:
                return OutputResponse.error(code="E0024", msg="Embedding failed")
        except Exception as ex:
            return OutputResponse.error(msg=str(ex))

    def get_url(self, file_id: str) -> str:
        """
        Get the URL of the uploaded file
        """
        try:
            # Fetch the file record
            upload_file = self.upload_crud.get_by_id(file_id)
            if not upload_file:
                return OutputResponse.error(msg="File not found")

            # Get pre-signed URL for the file
            file_url = self.s3.presigned_get_object(
                bucket_name=BUCKET_NAME,
                object_name=upload_file.url,
            )
            return file_url
        except Exception as ex:
            return str(ex)
        
    def get_file_by_id(self, file_id: str) -> Upload:
        """
        Get file by ID
        """
        try:
            # Fetch the file record
            upload_file = self.upload_crud.get_by_id(file_id)
            if not upload_file:
                raise ValueError("File not found")
            return upload_file
        except Exception as ex:
            raise ex