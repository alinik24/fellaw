"""Add the professional layer required by feature migration 002.

Revision ID: 001_professionals
Revises: 001_initial

The original initial migration creates citizen-facing tables but omitted
law_firms, lawyer_profiles, referrals, and lawyer_reviews even though the
application and migration 002 reference them.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_professionals"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _id() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()"))


def upgrade() -> None:
    op.create_table(
        "law_firms",
        _id(),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("specializations", postgresql.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("postal_code", sa.String(20), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("website", sa.String(512), nullable=True),
        sa.Column("logo_url", sa.String(1024), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("languages", postgresql.JSON(), nullable=False, server_default=sa.text("'[\"de\"]'::json")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_law_firms_slug", "law_firms", ["slug"])

    op.create_table(
        "lawyer_profiles",
        _id(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("law_firm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("law_firms.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(50), nullable=True),
        sa.Column("bar_number", sa.String(100), nullable=True),
        sa.Column("specializations", postgresql.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("languages", postgresql.JSON(), nullable=False, server_default=sa.text("'[\"de\"]'::json")),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("hourly_rate", sa.Float(), nullable=True),
        sa.Column("offers_free_consultation", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("consultation_fee", sa.Float(), nullable=True),
        sa.Column("avatar_url", sa.String(1024), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("available_for_referrals", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("cases_handled", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_lawyer_profiles_user_id", "lawyer_profiles", ["user_id"], unique=True)
    op.create_index("ix_lawyer_profiles_law_firm_id", "lawyer_profiles", ["law_firm_id"])

    op.create_table(
        "referrals",
        _id(),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("citizen_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lawyer_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lawyer_profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("law_firm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("law_firms.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("urgency", sa.String(20), nullable=False, server_default="medium"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("lawyer_response", sa.Text(), nullable=True),
        sa.Column("referral_type", sa.String(30), nullable=False, server_default="self_referral"),
        sa.Column("estimated_fee", sa.Float(), nullable=True),
        sa.Column("accepted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_referrals_case_id", "referrals", ["case_id"])
    op.create_index("ix_referrals_citizen_user_id", "referrals", ["citizen_user_id"])
    op.create_index("ix_referrals_lawyer_profile_id", "referrals", ["lawyer_profile_id"])
    op.create_index("ix_referrals_law_firm_id", "referrals", ["law_firm_id"])

    op.create_table(
        "lawyer_reviews",
        _id(),
        sa.Column("lawyer_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lawyer_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_lawyer_reviews_lawyer_profile_id", "lawyer_reviews", ["lawyer_profile_id"])
    op.create_index("ix_lawyer_reviews_reviewer_user_id", "lawyer_reviews", ["reviewer_user_id"])


def downgrade() -> None:
    op.drop_table("lawyer_reviews")
    op.drop_table("referrals")
    op.drop_table("lawyer_profiles")
    op.drop_table("law_firms")
