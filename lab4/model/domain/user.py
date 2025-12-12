from pydantic import BaseModel

class UserD(BaseModel):
    username: str
    email: str
