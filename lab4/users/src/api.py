from pydantic import ValidationError
from fastapi import Depends, Request, APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from commons.base import db_session
from commons.domain.user import UserDTO
from sqlalchemy.sql import select, exists
from commons.orm.user import User
from pwdlib import PasswordHash

router = APIRouter(prefix="/api")

SECRET_KEY = "c2aa543d02fc85502908a67b8664b7a09d74ba2593aa797bc9cf060aa908c45c"

passwordhash = PasswordHash.recommended()


def _hash_password(password: str) -> str:


@router.get("/users")
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
        password_hash=_hash_password(
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
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    try:
        if _hash_password(user.password) != user_orm.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    import jwt

    token = jwt.encode({"user_id": user_orm.id}, SECRET_KEY, algorithm="HS256")

    return {"token": token}