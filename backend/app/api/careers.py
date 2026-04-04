"""Careers and job applications API."""
from __future__ import annotations

from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.careers import JobPosting, JobApplication
from app.schemas.careers import (
    JobApplicationCreate,
    JobApplicationResponse,
    JobPostingResponse,
)

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/careers", tags=["careers"])


@router.get("/jobs", response_model=list[JobPostingResponse])
async def list_job_postings(
    db: Annotated[AsyncSession, Depends(get_db)],
    department: str | None = None,
    location: str | None = None,
    employment_type: str | None = None,
    skip: int = 0,
    limit: int = 20,
):
    """List active job postings."""
    query = select(JobPosting).where(JobPosting.is_active == True)

    if department:
        query = query.where(JobPosting.department == department)
    if location:
        query = query.where(JobPosting.location.ilike(f"%{location}%"))
    if employment_type:
        query = query.where(JobPosting.employment_type == employment_type)

    result = await db.execute(
        query.order_by(JobPosting.posted_date.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/jobs/{job_id}", response_model=JobPostingResponse)
async def get_job_posting(
    job_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get job posting details."""
    result = await db.execute(
        select(JobPosting).where(JobPosting.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )

    return job


@router.post("/applications", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def submit_job_application(
    data: JobApplicationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a job application."""
    # Verify job posting exists and is active
    job_result = await db.execute(
        select(JobPosting).where(
            JobPosting.id == data.job_posting_id,
            JobPosting.is_active == True,
        )
    )
    job = job_result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or no longer accepting applications",
        )

    # Check if user already applied
    existing_app = await db.execute(
        select(JobApplication).where(
            JobApplication.job_posting_id == data.job_posting_id,
            JobApplication.email == data.email,
        )
    )
    if existing_app.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this position",
        )

    application = JobApplication(
        job_posting_id=data.job_posting_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        resume_url=data.resume_url,
        cover_letter=data.cover_letter,
        portfolio_url=str(data.portfolio_url) if data.portfolio_url else None,
        linkedin_url=str(data.linkedin_url) if data.linkedin_url else None,
        years_experience=data.years_experience,
        current_location=data.current_location,
        willing_to_relocate=data.willing_to_relocate,
        notice_period=data.notice_period,
        expected_salary=data.expected_salary,
        custom_answers=data.custom_answers,
        status="submitted",
    )

    db.add(application)
    await db.commit()
    await db.refresh(application)

    log.info(
        "job_application_submitted",
        application_id=str(application.id),
        job_id=str(data.job_posting_id),
        applicant_email=data.email,
    )

    # TODO: Send confirmation email to applicant
    # TODO: Notify HR team

    return application


@router.get("/departments", response_model=list[str])
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all departments with active job postings."""
    result = await db.execute(
        select(JobPosting.department)
        .where(JobPosting.is_active == True)
        .distinct()
    )
    return result.scalars().all()
