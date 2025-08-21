import typer
from app.core.database import SessionLocal
from app.models.user import User
from app.logic.user import Auth
from datetime import datetime
from app.services.notifications import NotificationBadgeCRUD
from app.models.upload import Upload
from uuid import uuid4

app = typer.Typer()
auth = Auth()


@app.command()
def create_admin_user(email: str, password: str):
    try:
        db = SessionLocal()
        id = uuid4()
        hashed_password = auth.encode_password(password)
        user = User(id=id, email=email, password=hashed_password,
                    created_at=datetime.now(), created_by=id, role=1)
        db.add(user)
        db.commit()
        db.close()
        # Create notification badge for the admin user
        notification_crud = NotificationBadgeCRUD(db)
        notification_crud.create_badge(str(id))
        print(
            f"First user created with email: {email} and password: {password}")
    except Exception as e:
        print("Error creating first user", e)

@app.command()
def create_notification_badge_all_user():
    try:
        db = SessionLocal()
        all_user = db.query(User).all()
        notification_crud = NotificationBadgeCRUD(db)
        user_ids_without_badge = []
        for user in all_user:
            existing_badge = notification_crud.get_by_user_id(user.id)
            if not existing_badge:
                user_ids_without_badge.append(user.id)
        if user_ids_without_badge:
            notification_crud.bulk_create_badges(user_ids_without_badge)
        db.commit()
        db.close()
        print("Notification badges created for all users")
    except Exception as e:
        print("Error creating notification badge", e)

@app.command()
def set_true_to_field_is_error():
    db = SessionLocal()
    try:
        db.query(Upload).filter(Upload.is_error.is_(None)).update(
            {Upload.is_error: True}, synchronize_session=False
        )
        db.commit()
        print("Field is_error set to True for all uploads with None value")
    except Exception as e:
        print("Error setting is_error field", e)
    finally:
        db.close()


@app.command()
def hello(name: str):
    typer.echo(f"Hello {name}")


if __name__ == "__main__":
    app()
