"""Add emergency, insurance, mediation, careers, templates, and notifications.

Revision ID: 002
Revises: 001
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Emergency tables
    op.create_table(
        'emergency_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('emergency_type', sa.String(50), nullable=False),
        sa.Column('urgency_level', sa.Integer, nullable=False, server_default='3'),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('location', sa.String(512), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('immediate_advice', postgresql.JSON, nullable=True),
        sa.Column('assigned_lawyer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('lawyer_profiles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('first_response_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_emergency_cases_user_id', 'emergency_cases', ['user_id'])

    op.create_table(
        'emergency_contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contact_type', sa.String(50), nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('website', sa.String(512), nullable=True),
        sa.Column('available_24_7', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('availability_hours', sa.String(255), nullable=True),
        sa.Column('languages', postgresql.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Insurance tables
    op.create_table(
        'insurance_partners',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('logo_url', sa.String(512), nullable=True),
        sa.Column('website', sa.String(512), nullable=True),
        sa.Column('specialties', postgresql.JSON, nullable=True),
        sa.Column('has_api_integration', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('api_endpoint', sa.String(512), nullable=True),
        sa.Column('api_credentials', postgresql.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('partnership_start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'insurance_coverage',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('partner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('insurance_partners.id', ondelete='CASCADE'), nullable=False),
        sa.Column('policy_number', sa.String(100), nullable=False),
        sa.Column('policy_holder_name', sa.String(255), nullable=True),
        sa.Column('coverage_areas', postgresql.JSON, nullable=True),
        sa.Column('coverage_limit', sa.String(100), nullable=True),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_insurance_coverage_user_id', 'insurance_coverage', ['user_id'])

    op.create_table(
        'insurance_queries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=True),
        sa.Column('query_type', sa.String(50), nullable=False),
        sa.Column('case_type', sa.String(100), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_covered', sa.Boolean, nullable=True),
        sa.Column('coverage_details', postgresql.JSON, nullable=True),
        sa.Column('response_text', sa.Text, nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_insurance_queries_user_id', 'insurance_queries', ['user_id'])

    # Mediation tables
    op.create_table(
        'mediators',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('certification_number', sa.String(100), nullable=True),
        sa.Column('certifying_body', sa.String(255), nullable=True),
        sa.Column('years_experience', sa.Numeric, nullable=True),
        sa.Column('specializations', postgresql.JSON, nullable=True),
        sa.Column('languages', postgresql.JSON, nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('hourly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('bio', sa.Text, nullable=True),
        sa.Column('profile_image_url', sa.String(512), nullable=True),
        sa.Column('average_rating', sa.Numeric(3, 2), nullable=True),
        sa.Column('total_mediations', sa.Numeric, nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_mediators_email', 'mediators', ['email'])

    op.create_table(
        'mediation_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('dispute_type', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('other_party_name', sa.String(255), nullable=True),
        sa.Column('other_party_contact', sa.String(255), nullable=True),
        sa.Column('preferred_mediator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('mediators.id', ondelete='SET NULL'), nullable=True),
        sa.Column('preferred_language', sa.String(10), nullable=True),
        sa.Column('preferred_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_mediation_requests_user_id', 'mediation_requests', ['user_id'])

    op.create_table(
        'mediation_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('mediation_request_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('mediation_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mediator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('mediators.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_number', sa.Numeric, nullable=False, server_default='1'),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Numeric, nullable=True),
        sa.Column('session_type', sa.String(50), nullable=False, server_default='video'),
        sa.Column('meeting_url', sa.String(512), nullable=True),
        sa.Column('meeting_password', sa.String(100), nullable=True),
        sa.Column('location', sa.String(512), nullable=True),
        sa.Column('mediator_notes', sa.Text, nullable=True),
        sa.Column('outcome', sa.String(50), nullable=True),
        sa.Column('agreement_reached', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('agreement_document_url', sa.String(512), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='scheduled'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_mediation_sessions_request_id', 'mediation_sessions', ['mediation_request_id'])

    op.create_table(
        'mediation_reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('mediation_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mediator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('mediators.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Numeric, nullable=False),
        sa.Column('review_text', sa.Text, nullable=True),
        sa.Column('would_recommend', sa.Boolean, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_mediation_reviews_session_id', 'mediation_reviews', ['session_id'])

    # Careers tables
    op.create_table(
        'job_postings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('department', sa.String(100), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('employment_type', sa.String(50), nullable=False),
        sa.Column('experience_level', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('responsibilities', postgresql.JSON, nullable=True),
        sa.Column('qualifications', postgresql.JSON, nullable=True),
        sa.Column('benefits', postgresql.JSON, nullable=True),
        sa.Column('salary_min', sa.Integer, nullable=True),
        sa.Column('salary_max', sa.Integer, nullable=True),
        sa.Column('salary_currency', sa.String(3), nullable=False, server_default='EUR'),
        sa.Column('required_skills', postgresql.JSON, nullable=True),
        sa.Column('preferred_skills', postgresql.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('positions_available', sa.Integer, nullable=False, server_default='1'),
        sa.Column('posted_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('application_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'job_applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_posting_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('job_postings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('resume_url', sa.String(512), nullable=True),
        sa.Column('cover_letter', sa.Text, nullable=True),
        sa.Column('portfolio_url', sa.String(512), nullable=True),
        sa.Column('linkedin_url', sa.String(512), nullable=True),
        sa.Column('years_experience', sa.Integer, nullable=True),
        sa.Column('current_location', sa.String(255), nullable=True),
        sa.Column('willing_to_relocate', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('notice_period', sa.String(100), nullable=True),
        sa.Column('expected_salary', sa.Integer, nullable=True),
        sa.Column('custom_answers', postgresql.JSON, nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='submitted'),
        sa.Column('internal_notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_job_applications_job_id', 'job_applications', ['job_posting_id'])
    op.create_index('ix_job_applications_email', 'job_applications', ['email'])

    # Templates tables
    op.create_table(
        'document_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('document_type', sa.String(100), nullable=False),
        sa.Column('template_content', sa.Text, nullable=False),
        sa.Column('required_fields', postgresql.JSON, nullable=True),
        sa.Column('conditional_fields', postgresql.JSON, nullable=True),
        sa.Column('instructions', sa.Text, nullable=True),
        sa.Column('legal_disclaimer', sa.Text, nullable=True),
        sa.Column('output_format', sa.String(10), nullable=False, server_default='pdf'),
        sa.Column('language', sa.String(10), nullable=False, server_default='de'),
        sa.Column('jurisdiction', sa.String(100), nullable=True),
        sa.Column('applicable_laws', postgresql.JSON, nullable=True),
        sa.Column('is_free', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('price', sa.Integer, nullable=True),
        sa.Column('usage_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('average_rating', postgresql.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'generated_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('document_templates.id', ondelete='CASCADE'), nullable=False),
        sa.Column('template_data', postgresql.JSON, nullable=False),
        sa.Column('file_url', sa.String(512), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='ready'),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('download_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('last_downloaded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_generated_documents_user_id', 'generated_documents', ['user_id'])

    op.create_table(
        'template_reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('document_templates.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Integer, nullable=False),
        sa.Column('review_text', sa.Text, nullable=True),
        sa.Column('was_helpful', sa.Boolean, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_template_reviews_template_id', 'template_reviews', ['template_id'])

    # Notifications tables
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action_url', sa.String(512), nullable=True),
        sa.Column('action_label', sa.String(100), nullable=True),
        sa.Column('extra_data', postgresql.JSON, nullable=True),
        sa.Column('is_read', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.String(20), nullable=False, server_default='medium'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])

    op.create_table(
        'user_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('session_id', sa.String(100), nullable=True),
        sa.Column('activity_type', sa.String(50), nullable=False),
        sa.Column('activity_data', postgresql.JSON, nullable=True),
        sa.Column('page_url', sa.String(512), nullable=True),
        sa.Column('referrer', sa.String(512), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_user_activities_user_id', 'user_activities', ['user_id'])
    op.create_index('ix_user_activities_session_id', 'user_activities', ['session_id'])
    op.create_index('ix_user_activities_created_at', 'user_activities', ['created_at'])


def downgrade() -> None:
    op.drop_table('user_activities')
    op.drop_table('notifications')
    op.drop_table('template_reviews')
    op.drop_table('generated_documents')
    op.drop_table('document_templates')
    op.drop_table('job_applications')
    op.drop_table('job_postings')
    op.drop_table('mediation_reviews')
    op.drop_table('mediation_sessions')
    op.drop_table('mediation_requests')
    op.drop_table('mediators')
    op.drop_table('insurance_queries')
    op.drop_table('insurance_coverage')
    op.drop_table('insurance_partners')
    op.drop_table('emergency_contacts')
    op.drop_table('emergency_cases')
