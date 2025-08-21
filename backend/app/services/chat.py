from typing import List

from sqlalchemy import update, delete


from app.services.base import CommonCRUD
from app.models.chat import ChatHistoryDetail, ChatHistory


class ChatCRUD(CommonCRUD):
    """
    CRUD class for the Chat model
    """

    def delete(self, ids: List[str], current_date_time, login_user_id):
        """
        Delete a list of chat ids
        """
        try:
            # Update the child table
            update_child_stmt = (update(ChatHistoryDetail).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(ChatHistoryDetail.chat_histories_id.in_(ids))
                .where(ChatHistoryDetail.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_child_stmt)

            # Update the parent table
            update_parent_stmt = (update(ChatHistory).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(ChatHistory.id.in_(ids)).where(ChatHistory.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_parent_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_list_hard_delete(self, three_years_ago):
        """
        Get ids chat history for hard delete chat
        """
        try:
            return self.db.query(ChatHistory).filter(
                ChatHistory.created_at < three_years_ago).all()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_list_soft_delete(self, one_year_ago, three_years_ago):
        """
        Get ids chat history for soft delete chat
        """
        try:
            return self.db.query(ChatHistory).filter(
                ChatHistory.created_at < one_year_ago, ChatHistory.created_at >= three_years_ago,
                ChatHistory.delete_flag == 0).all()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def delete_chat(self, ids_hard_delete: List[str], ids_soft_delete: List[str],
                    current_date_time, login_user_id):
        """
        Delete chat data older
        """
        try:
            # hard delete chat history detail
            delete_child_stmt = (delete(ChatHistoryDetail).where(
                ChatHistoryDetail.chat_histories_id.in_(ids_hard_delete)))

            # execute the delete statement
            self.db.execute(delete_child_stmt)

            # hard delete chat history
            delete_parent_stmt = (delete(ChatHistory).where(
                ChatHistory.id.in_(ids_hard_delete)))

            # execute the delete statement
            self.db.execute(delete_parent_stmt)

            # Update the child table
            update_child_stmt = (update(ChatHistoryDetail).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(ChatHistoryDetail.delete_flag == 0)
                .where(ChatHistoryDetail.chat_histories_id.in_(ids_soft_delete)))

            # Execute the update statement
            self.db.execute(update_child_stmt)

            # # Update the parent table
            update_parent_stmt = (update(ChatHistory).values(
                delete_flag=1,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(ChatHistory.delete_flag == 0)
                .where(ChatHistory.id.in_(ids_soft_delete)))

            # # Execute the update statement
            self.db.execute(update_parent_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_by_chat_id(self, chat_id, user_id: str):
        """
        Get a chat by chat id
        """
        try:
            # Check chat exists with the given id
            chat = self.db.query(ChatHistory).filter(
                ChatHistory.id == chat_id,
                ChatHistory.user_id == user_id,
                ChatHistory.delete_flag == 0).first()

            if not chat:
                return None

            return self.db.query(ChatHistoryDetail).filter(
                ChatHistoryDetail.chat_histories_id == chat_id,
                ChatHistoryDetail.delete_flag == 0).all()
        except Exception as ex:
            self.db.rollback()
            raise ex

    def get_all(self, login_user_id: str, search: str, page: int, limit: int) -> tuple[List[ChatHistory], str]:
        """
        Get all chats by user id
        """
        try:
            # Define the conditions
            conditions = (ChatHistory.user_id == login_user_id) & (ChatHistory.delete_flag == 0)
            if search:
                conditions = conditions & (
                    ChatHistory.talk_title.ilike(f"%{search}%"))
            # Query to get chat history information
            chat_history_list = (
                self.db.query(ChatHistory)
                .filter(conditions)
                .order_by(ChatHistory.created_at.desc())
            )
            total = chat_history_list.count()
            chat_history_list = chat_history_list.offset(
                (page - 1) * limit).limit(limit).all()
            return chat_history_list, total

        except Exception as ex:
            self.db.rollback()
            raise ex

    def update_talk_evaluation(self, id, talk_evaluation, current_date_time, login_user_id):
        """
        Update the talk evaluation of a chat
        """
        try:
            # Update the fields
            update_stmt = (update(ChatHistoryDetail).values(
                talk_evaluation=talk_evaluation,
                updated_by=login_user_id,
                updated_at=current_date_time
            ).where(ChatHistoryDetail.id == id)
                .where(ChatHistoryDetail.delete_flag == 0))

            # Execute the update statement
            self.db.execute(update_stmt)

            # Commit the changes to the database
            self.db.commit()
            return 1
        except Exception as ex:
            self.db.rollback()
            raise ex
