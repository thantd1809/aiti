"""Change ID to UUID

Revision ID: e743b4c86088
Revises: 62c20dc27fd4
Create Date: 2025-07-01 05:59:30.974805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e743b4c86088'
down_revision: Union[str, None] = '62c20dc27fd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # -- Drop foreign key constraints  --
    op.drop_constraint('access_control_entry_user_id_fkey', 'access_control_entry', type_='foreignkey')
    op.drop_constraint('access_control_entry_department_id_fkey', 'access_control_entry', type_='foreignkey')
    op.drop_constraint('access_control_entry_folder_id_fkey', 'access_control_entry', type_='foreignkey')
    op.drop_constraint('access_control_entry_file_id_fkey', 'access_control_entry', type_='foreignkey')
    op.drop_constraint('access_control_entry_permission_type_id_fkey', 'access_control_entry', type_='foreignkey')
    op.drop_constraint('folders_owner_id_fkey', 'folders', type_='foreignkey')
    op.drop_constraint('folders_parent_id_fkey', 'folders', type_='foreignkey')
    op.drop_constraint('embedding_files_folder_id_fkey', 'embedding_files', type_='foreignkey')
    op.drop_constraint('users_department_id_fkey', 'users', type_='foreignkey')
    op.drop_constraint('departments_parent_id_fkey', 'departments', type_='foreignkey')

    # -- Convert ID columns  --
    op.alter_column('users', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)
    op.alter_column('departments', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)
    op.alter_column('folders', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)
    op.alter_column('embedding_files', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)
    op.alter_column('permissions', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)
    op.alter_column('access_control_entry', 'id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=False)

    op.alter_column('access_control_entry', 'user_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('access_control_entry', 'department_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('access_control_entry', 'folder_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('access_control_entry', 'file_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('access_control_entry', 'permission_type_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True, nullable=True)
    op.alter_column('folders', 'owner_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), nullable=True)
    op.alter_column('folders', 'parent_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('embedding_files', 'folder_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('users', 'department_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('departments', 'parent_id', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)

    op.alter_column('access_control_entry', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), nullable=True)
    op.alter_column('access_control_entry', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('chat_histories', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('chat_histories', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('chat_history_details', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('chat_history_details', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('departments', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), nullable=True)
    op.alter_column('departments', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('embedding_files', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('embedding_files', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('folders', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), nullable=True)
    op.alter_column('folders', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('permissions', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), nullable=True)
    op.alter_column('permissions', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('users', 'created_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)
    op.alter_column('users', 'updated_by', existing_type=sa.INTEGER(), type_=sa.String(length=36), existing_nullable=True)

    # -- Re-create foreign keys --
    op.create_foreign_key('access_control_entry_user_id_fkey', 'access_control_entry', 'users', ['user_id'], ['id'])
    op.create_foreign_key('access_control_entry_department_id_fkey', 'access_control_entry', 'departments', ['department_id'], ['id'])
    op.create_foreign_key('access_control_entry_folder_id_fkey', 'access_control_entry', 'folders', ['folder_id'], ['id'])
    op.create_foreign_key('access_control_entry_file_id_fkey', 'access_control_entry', 'embedding_files', ['file_id'], ['id'])
    op.create_foreign_key('access_control_entry_permission_type_id_fkey', 'access_control_entry', 'permissions', ['permission_type_id'], ['id'])
    op.create_foreign_key('folders_owner_id_fkey', 'folders', 'users', ['owner_id'], ['id'])
    op.create_foreign_key('folders_parent_id_fkey', 'folders', 'folders', ['parent_id'], ['id'])
    op.create_foreign_key('embedding_files_folder_id_fkey', 'embedding_files', 'folders', ['folder_id'], ['id'])
    op.create_foreign_key('users_department_id_fkey', 'users', 'departments', ['department_id'], ['id'])
    op.create_foreign_key('departments_parent_id_fkey', 'departments', 'departments', ['parent_id'], ['id'])

def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('users', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('users', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('users', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False,
               existing_server_default=sa.text("nextval('users_id_seq'::regclass)"))
    op.alter_column('users', 'department_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('permissions', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('permissions', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('permissions', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False,
               existing_server_default=sa.text("nextval('permissions_id_seq'::regclass)"))
    op.alter_column('folders', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('folders', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('folders', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('folders', 'owner_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('folders', 'parent_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('embedding_files', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('embedding_files', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('embedding_files', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False,
               existing_server_default=sa.text("nextval('embedding_files_id_seq'::regclass)"))
    op.alter_column('embedding_files', 'folder_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('departments', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('departments', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('departments', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False,
               existing_server_default=sa.text("nextval('departments_id_seq'::regclass)"))
    op.alter_column('departments', 'parent_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('chat_history_details', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('chat_history_details', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('chat_history_details', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('chat_history_details', 'chat_histories_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('chat_histories', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('chat_histories', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('chat_histories', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('chat_histories', 'user_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('access_control_entry', 'updated_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('access_control_entry', 'created_by',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('access_control_entry', 'id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=False)
    op.alter_column('access_control_entry', 'permission_type_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               nullable=False)
    op.alter_column('access_control_entry', 'file_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('access_control_entry', 'folder_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('access_control_entry', 'department_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('access_control_entry', 'user_id',
               existing_type=sa.String(length=36),
               type_=sa.INTEGER(),
               existing_nullable=True)
    # ### end Alembic commands ###
