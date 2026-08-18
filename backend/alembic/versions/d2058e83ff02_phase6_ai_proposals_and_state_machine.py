"""phase6_ai_proposals_and_state_machine

Revision ID: d2058e83ff02
Revises: c1048f72ee01
Create Date: 2026-08-18 04:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd2058e83ff02'
down_revision: Union[str, None] = 'c1048f72ee01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create ai_proposals table
    op.create_table(
        'ai_proposals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('proposal_id', sa.String(length=50), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('ai_run_id', sa.String(length=50), nullable=True),
        sa.Column('proposal_type', sa.String(length=50), nullable=False, server_default='FIELD_MUTATION'),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('current_value', sa.Text(), nullable=True),
        sa.Column('proposed_value', sa.Text(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=False, server_default='AI Risk Assessment'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.95'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='AI_PROPOSED'),
        sa.Column('reviewer_decision', sa.Text(), nullable=True),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.String(length=100), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_ai_proposals_proposal_id'), 'ai_proposals', ['proposal_id'], unique=True)
    op.create_index(op.f('ix_ai_proposals_complaint_id'), 'ai_proposals', ['complaint_id'], unique=False)
    op.create_index(op.f('ix_ai_proposals_status'), 'ai_proposals', ['status'], unique=False)
    op.create_index('ix_proposals_complaint_status', 'ai_proposals', ['complaint_id', 'status'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_proposals_complaint_status', table_name='ai_proposals')
    op.drop_index(op.f('ix_ai_proposals_status'), table_name='ai_proposals')
    op.drop_index(op.f('ix_ai_proposals_complaint_id'), table_name='ai_proposals')
    op.drop_index(op.f('ix_ai_proposals_proposal_id'), table_name='ai_proposals')
    op.drop_table('ai_proposals')
