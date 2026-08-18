"""phase4_ai_runs_and_versioning

Revision ID: c1048f72ee01
Revises: b9529d37df04
Create Date: 2026-08-18 03:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1048f72ee01'
down_revision: Union[str, None] = 'b9529d37df04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create ai_runs table
    op.create_table(
        'ai_runs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ai_run_id', sa.String(length=64), nullable=False),
        sa.Column('request_id', sa.String(length=64), nullable=True),
        sa.Column('conversation_id', sa.String(length=64), nullable=True),
        sa.Column('complaint_id', sa.Integer(), nullable=True),
        sa.Column('workflow_name', sa.String(length=64), nullable=False),
        sa.Column('requested_model', sa.String(length=64), nullable=False),
        sa.Column('actual_model', sa.String(length=64), nullable=False),
        sa.Column('fallback_used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('fallback_reason', sa.String(length=255), nullable=True),
        sa.Column('prompt_version', sa.String(length=32), nullable=False, server_default='v1.0'),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('input_payload', sa.JSON(), nullable=True),
        sa.Column('output_payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='SET NULL')
    )
    op.create_index(op.f('ix_ai_runs_ai_run_id'), 'ai_runs', ['ai_run_id'], unique=True)
    op.create_index(op.f('ix_ai_runs_request_id'), 'ai_runs', ['request_id'], unique=False)
    op.create_index(op.f('ix_ai_runs_complaint_id'), 'ai_runs', ['complaint_id'], unique=False)
    op.create_index('ix_ai_runs_workflow_created', 'ai_runs', ['workflow_name', 'created_at'], unique=False)

    # 2. Add document versioning columns to complaint_documents
    with op.batch_alter_table('complaint_documents') as batch_op:
        batch_op.add_column(sa.Column('file_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('document_version', sa.Integer(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('evidence_spans', sa.JSON(), nullable=True))

    # 3. Add change tracking columns to complaint_events
    with op.batch_alter_table('complaint_events') as batch_op:
        batch_op.add_column(sa.Column('diffs', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('ai_run_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('actor_type', sa.String(length=32), nullable=False, server_default='HUMAN'))

def downgrade() -> None:
    with op.batch_alter_table('complaint_events') as batch_op:
        batch_op.drop_column('actor_type')
        batch_op.drop_column('ai_run_id')
        batch_op.drop_column('diffs')

    with op.batch_alter_table('complaint_documents') as batch_op:
        batch_op.drop_column('evidence_spans')
        batch_op.drop_column('document_version')
        batch_op.drop_column('file_hash')

    op.drop_index('ix_ai_runs_workflow_created', table_name='ai_runs')
    op.drop_index(op.f('ix_ai_runs_complaint_id'), table_name='ai_runs')
    op.drop_index(op.f('ix_ai_runs_request_id'), table_name='ai_runs')
    op.drop_index(op.f('ix_ai_runs_ai_run_id'), table_name='ai_runs')
    op.drop_table('ai_runs')
