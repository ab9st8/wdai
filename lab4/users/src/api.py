from pydantic import ValidationError
from fastapi import Depends, Request, APIRouter, HTTPException, status, Response
from model.base import db_session
from model.domain.user import UserDTO
from sqlalchemy.sql import select, exists
from model.orm.user import User

router = APIRouter(prefix="/api")

SALT = "iAgjzJ5OZPhDBsIR+4nXIwDt1AEdcF15"


def _hash_password(password: str) -> str:
    from pyargon2 import hash

    return hash(password, salt=SALT)


@router.get("/users")
async def get_users(db_session=Depends(db_session)):
    query = select(User)
    result = db_session.execute(query)
    return result.scalars().all()

@router.head("/users/{user_id}", summary="Sprawdza, czy użytkownik o podanym id istnieje") # TIL
async def get_user(user_id: int, db_session=Depends(db_session)):
    query = select(exists().where(User.id == user_id))
    result = db_session.execute(query).scalar()
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return Response(status_code=status.HTTP_200_OK)

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
