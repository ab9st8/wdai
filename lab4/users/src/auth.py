from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from commons.model.orm.user import User
from commons.model.base import db_session_cm
from commons.auth.token import TokenData, decode_jwt
from sqlalchemy.sql import select

security = HTTPBearer()

async def get_current_user_email(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]
):
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        payload = decode_jwt(token.credentials)
        
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        token_data = TokenData(email=email)

    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    return token_data