
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import RegisterRequest, LoginRequest


router = APIRouter(prefix="/auth", tags=["Authentication"])

bearer_scheme = HTTPBearer(auto_error=False)

DEFAULT_ROLES = {
    "Admin": "Full system administrator",
    "Campaign Manager": "Manage public awareness campaigns",
    "Communication Team": "Create and distribute public communications",
}


def seed_default_roles(db: Session) -> None:
    existing_roles = {
        role.name for role in db.query(Role).all()
    }

    for role_name, description in DEFAULT_ROLES.items():
        if role_name not in existing_roles:
            db.add(
                Role(
                    name=role_name,
                    description=description,
                )
            )

    db.commit()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = payload.get("sub")

        if not user_id:
            raise unauthorized

        user = (
            db.query(User)
            .filter(User.id == int(user_id))
            .first()
        )

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise unauthorized

    if not user:
        raise unauthorized

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive",
        )

    return user


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    try:
        seed_default_roles(db)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to initialize default roles",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists",
        )

    # Never allow public registration to create an Admin.
    if payload.role == "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Admin accounts cannot be created "
                "through public registration"
            ),
        )

    role = (
        db.query(Role)
        .filter(Role.name == payload.role)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected",
        )

    user = User(
        name=payload.name,
        email=email,
        phone=payload.phone,
        organization_name=payload.organization_name,
        password_hash=hash_password(payload.password),
        role_id=role.id,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to register user",
        )

    return {
        "message": "Registration successful",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": role.name,
    }


@router.post("/login")
def login_user(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Temporary diagnostics: never print the password or full hash.
    print("Login email:", email)
    print("User found:", user is not None)

    if user:
        print("User ID:", user.id)
        print("Account active:", user.is_active)

        stored_hash = user.password_hash or ""

        print(
            "Password hash format:",
            (
                stored_hash.split("$")[1]
                if "$" in stored_hash
                else "Unexpected format"
            ),
        )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive",
        )

    role = (
        db.query(Role)
        .filter(Role.id == user.role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role is not configured",
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "role": role.name,
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role.name,
        },
    }


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = (
        db.query(Role)
        .filter(Role.id == current_user.role_id)
        .first()
    )

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "organization_name": current_user.organization_name,
        "role": role.name if role else None,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }


# ---------------- ROLE-BASED ACCESS CONTROL ----------------

def require_role(required_role: str):
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        role = (
            db.query(Role)
            .filter(Role.id == current_user.role_id)
            .first()
        )

        if (
            not role
            or role.name.lower() != required_role.lower()
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource"
                ),
            )

        return current_user

    return role_checker


# ---------------- ADMIN: LIST USERS ----------------

@router.get("/users")
def list_users(
    admin: User = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()

    result = []

    for user in users:
        role = (
            db.query(Role)
            .filter(Role.id == user.role_id)
            .first()
        )

        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "organization_name": user.organization_name,
            "role": role.name if role else None,
            "is_active": bool(user.is_active),
            "created_at": user.created_at,
        })

    return result


# ---------------- ADMIN: CHANGE USER ROLE ----------------

@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    role_name: str,
    admin: User = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    role = (
        db.query(Role)
        .filter(Role.name == role_name)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role name",
        )

    if (
        user.id == admin.id
        and role.name.lower() != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own Admin role",
        )

    user.role_id = role.id
    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated successfully",
        "user_id": user.id,
        "role": role.name,
    }


# ---------------- ADMIN: ACTIVATE / DEACTIVATE USER ----------------

@router.patch("/users/{user_id}/status")
def change_user_status(
    user_id: int,
    is_active: bool,
    admin: User = Depends(require_role("Admin")),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated successfully",
        "user_id": user.id,
        "is_active": user.is_active,
    }
