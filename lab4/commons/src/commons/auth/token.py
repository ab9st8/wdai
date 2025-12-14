from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from pyjwt import jwt
from datetime import datetime, timedelta

SECRET_KEY = "c2aa543d02fc85502908a67b8664b7a09d74ba2593aa797bc9cf060aa908c45d"
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: str = Field(pattern=r'^[\w\.-]+@[\w\.-]+\.\w{2,4}$')

password_hash = PasswordHash.recommended()

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)
    
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.now(datetime.timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt