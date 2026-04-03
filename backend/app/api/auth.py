"""
Authentication router.

Endpoints:
  POST /auth/register   – create a new account
  POST /auth/login      – obtain JWT token (OAuth2 password form)
  POST /auth/guest      – create an anonymous/guest session
  GET  /auth/me         – current user profile
  PUT  /auth/me         – update current user profile
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.user import GuestSession, Token, UserCreate, UserResponse, UserUpdate

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Security utilities
# ---------------------------------------------------------------------------

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT for the given subject (user UUID as string)."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> str | None:
    """Decode a JWT and return the subject (user UUID string), or None on failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# FastAPI dependency: current user
# ---------------------------------------------------------------------------


async def get_current_user(
    token: Annotated[str, Depends(_oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Resolve the JWT bearer token to a User ORM object."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Ungültige oder abgelaufene Anmeldedaten.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    subject = verify_token(token)
    if subject is None:
        raise credentials_exc

    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise credentials_exc

    stmt = select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user is None:
        raise credentials_exc
    return user


# Type alias for DI
CurrentUser = Annotated[User, Depends(get_current_user)]


async def has_lawyer_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    FastAPI dependency that verifies the authenticated user has a LawyerProfile.

    Raises HTTP 403 if no profile exists.  Returns the User object so that
    downstream endpoints can still access it via the standard CurrentUser alias
    while also being protected by this guard.

    Usage::

        @router.post("/some-lawyer-only-endpoint")
        async def endpoint(current_user: Annotated[User, Depends(has_lawyer_profile)]):
            ...
    """
    from sqlalchemy import select
    from app.models.professional import LawyerProfile

    stmt = select(LawyerProfile).where(LawyerProfile.user_id == current_user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Zugriff verweigert: Kein Anwaltsprofil gefunden. "
                "Registrieren Sie sich zunächst als Anwalt unter "
                "POST /api/v1/professionals/lawyers/profile."
            ),
        )
    return current_user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Neuen Nutzer registrieren",
)
async def register(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    # Check duplicate email
    stmt = select(User).where(User.email == body.email)
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-Mail-Adresse wird bereits verwendet.",
        )

    user = User(
        email=body.email,
        hashed_password=_hash_password(body.password),
        full_name=body.full_name,
        preferred_language=body.preferred_language,
        is_active=True,
        is_anonymous=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    log.info("register.success", user_id=str(user.id), email=user.email)
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post(
    "/login",
    response_model=Token,
    summary="Anmelden und JWT-Token erhalten",
)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    stmt = select(User).where(User.email == form_data.username, User.is_active == True)  # noqa: E712
    user = (await db.execute(stmt)).scalars().first()

    if user is None or not _verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falsche E-Mail-Adresse oder falsches Passwort.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(str(user.id))
    log.info("login.success", user_id=str(user.id))
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post(
    "/guest",
    response_model=GuestSession,
    status_code=status.HTTP_201_CREATED,
    summary="Anonyme Gastsitzung erstellen",
)
async def create_guest_session(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GuestSession:
    guest_uuid = uuid.uuid4()
    guest_email = f"guest_{guest_uuid.hex[:12]}@guest.legalassist.local"

    user = User(
        email=guest_email,
        hashed_password=_hash_password(str(guest_uuid)),
        full_name=None,
        preferred_language="de",
        is_active=True,
        is_anonymous=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(
        str(user.id),
        expires_delta=timedelta(hours=24),  # Guests expire after 24 h
    )
    log.info("guest_session.created", session_id=str(user.id))
    return GuestSession(session_id=user.id, token=token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Eigenes Nutzerprofil abrufen",
)
async def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Nutzerprofil aktualisieren",
)
async def update_me(
    body: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.preferred_language is not None:
        current_user.preferred_language = body.preferred_language

    await db.flush()
    await db.refresh(current_user)
    log.info("update_me.success", user_id=str(current_user.id))
    return UserResponse.model_validate(current_user)
