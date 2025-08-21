class CommonCRUD:
    """
    Common CRUD class for all the CRUD classes
    """
    __abstract__ = True

    def __init__(self, db):
        self.db = db

    def create(self, model):
        """
        Common method to create a new record in the database
        """
        try:
            self.db.add(model)
            self.db.commit()
            self.db.refresh(model)

            return model, None
        except Exception as ex:
            self.db.rollback()
            return None, ex
