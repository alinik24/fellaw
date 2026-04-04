"""Notifications API."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.database import get_db
from app.models.notifications import Notification
from app.models.user import User
from app.schemas.notifications import MarkNotificationRead, NotificationResponse

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    is_read: bool | None = None,
    priority: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    """List user notifications."""
    query = select(Notification).where(Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    if priority:
        query = query.where(Notification.priority == priority)

    result = await db.execute(
        query.order_by(
            Notification.priority.desc(),
            Notification.created_at.desc()
        ).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get count of unread notifications."""
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    count = result.scalar_one()
    return {"unread_count": count}


@router.post("/mark-read", response_model=dict)
async def mark_notifications_read(
    data: MarkNotificationRead,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark notifications as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id.in_(data.notification_ids),
            Notification.user_id == current_user.id,
        )
    )
    notifications = result.scalars().all()

    if not notifications:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No notifications found",
        )

    for notification in notifications:
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now()

    await db.commit()

    return {"marked_read": len(notifications)}


@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark all user notifications as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    notifications = result.scalars().all()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.now()

    await db.commit()

    return {"marked_read": len(notifications)}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    await db.delete(notification)
    await db.commit()
