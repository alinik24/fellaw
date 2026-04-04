"""Pydantic schemas for notifications."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Notification details."""

    id: UUID
    user_id: UUID
    notification_type: str
    title: str
    message: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[UUID]
    action_url: Optional[str]
    action_label: Optional[str]
    extra_data: Optional[dict]
    is_read: bool
    read_at: Optional[datetime]
    priority: str
    created_at: datetime

    class Config:
        from_attributes = True


class MarkNotificationRead(BaseModel):
    """Mark notification as read."""

    notification_ids: list[UUID]
