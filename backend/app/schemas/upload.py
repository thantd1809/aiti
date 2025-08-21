from pydantic import BaseModel
from datetime import datetime
from typing import List


class UploadDetailRequest(BaseModel):
    """
    The request body for the detail of file upload.
    """
    name: str
    last_modified: datetime


class UploadRequest(BaseModel):
    """
    The request body for the upload endpoint.
    """
    uploaded_files: List[UploadDetailRequest]


class UploadCMDRequest(BaseModel):
    """
    The request body for the upload by CMD endpoint.
    """
    source_path: str


class UpdateUploadRequest(BaseModel):
    """
    The request body for the update-upload endpoint.
    """
    last_embedding_dt: datetime
    embedding_status: int


class UpdateReservationRequest(BaseModel):
    """
    The request body for the update-reservation endpoint.
    """
    upload_file_id: str
    reservation_date: datetime


class DeleteUploadRequest(BaseModel):
    """
    The request body for the delete-upload endpoint.
    """
    file_ids: List[str]


class RetryUploadRequest(BaseModel):
    """
    The request body for the retry-upload endpoint.
    """
    file_id: str