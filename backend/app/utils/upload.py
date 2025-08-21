from app.services.upload import UploadCRUD


class UploadValid:
    def __init__(self, db):
        self.upload_crud = UploadCRUD(db)

    def check_filename_exist(self, file_name):
        """
        Check if the file_name is valid.
        """
        try:
            upload = self.upload_crud.get_by_name(file_name)
            return upload
        except Exception as ex:
            raise ex
