from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from database import get_db
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
COOKIE_OPTIONS = dict(httponly=True, samesite="strict", secure=False)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        display_name=body.display_name,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(str(user.id))
    response.set_cookie(REFRESH_COOKIE, refresh_token, **COOKIE_OPTIONS)

    return TokenResponse(
        access_token=access_token,
        user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(str(user.id))
    response.set_cookie(REFRESH_COOKIE, refresh_token, **COOKIE_OPTIONS)

    return TokenResponse(
        access_token=access_token,
        user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(response: Response, db: AsyncSession = Depends(get_db), refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        user_id = decode_refresh_token(refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    new_access = create_access_token({"sub": str(user.id), "email": user.email})
    new_refresh = create_refresh_token(str(user.id))
    response.set_cookie(REFRESH_COOKIE, new_refresh, **COOKIE_OPTIONS)

    return TokenResponse(
        access_token=new_access,
        user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, _: User = Depends(get_current_user)):
    response.delete_cookie(REFRESH_COOKIE)
