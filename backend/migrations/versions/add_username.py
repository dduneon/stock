"""add username to users

Revision ID: add_username
Revises: 8dcb7fc1ae69
Create Date: 2026-02-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_username'
down_revision = '8dcb7fc1ae69'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('username', sa.String(length=80), nullable=True))
    op.create_index('ix_users_username', 'users', ['username'], unique=True)


def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    op.drop_column('users', 'username')
