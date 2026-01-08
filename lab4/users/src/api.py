from datetime import timedelta
from pydantic import ValidationError
from commons.auth.token import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_password_hash, verify_password
from fastapi import Depends, Request, APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from commons.model.base import db_session
from commons.model.domain.user import UserDTO
from commons.model.orm.user import User
from commons.auth.token import get_current_user_email
from sqlalchemy.sql import select, exists
from pwdlib import PasswordHash
import jwt

router = APIRouter(prefix="/api")
protected_router = APIRouter(prefix="/api", dependencies=[Depends(get_current_user_email)])

@protected_router.get("/users")
async def get_users(db_session=Depends(db_session)):
    query = select(User)
    result = db_session.execute(query)
    return result.scalars().all()

@router.head("/users/{user_id}", summary="Sprawdza, czy użytkownik o podanym id istnieje") # TIL
async def head_user(user_id: int, db_session=Depends(db_session)):
    query = select(exists().where(User.id == user_id))
    result = db_session.execute(query).scalar()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return JSONResponse(status_code=status.HTTP_200_OK, content=None)

@router.post(
    "/users",
    summary="Rejestracja nowego użytkownika (email, password). Zwraca id użytkownika.",
)
async def post_users(request: Request, db_session=Depends(db_session)):
    try:
        user = UserDTO.model_validate(await request.json())
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong: {e}",
        )

    new_user = User(
        email=user.email,
        password_hash=get_password_hash(
            user.password
        ),  # i'm pretty sure ideally we would hash on the client side cause can't the password be intercepted in transit otherwise?
    )

    db_session.add(new_user)
    db_session.commit()
    db_session.refresh(new_user)

    return new_user.id

@router.post("/users/login", summary="Logowanie użytkownika (email + password). Zwraca JWT token.")
async def login_user(request: Request, db_session=Depends(db_session)):
    try:
        user = UserDTO.model_validate(await request.json())
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong: {e}",
        )

    query = select(User).where(User.email == user.email)
    result = db_session.execute(query)
    user_orm = result.scalar_one_or_none()

    if not user_orm:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(user.password, user_orm.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"}
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_orm.email}, expires_delta=access_token_expires
    )

    return JSONResponse(status_code=status.HTTP_200_OK, content={"access_token": access_token, "token_type": "bearer"})