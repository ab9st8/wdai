from pydantic import BaseModel, Field

class UserD(BaseModel):
    username: str
    email: str = Field(regex=r'^[\w\.-]+@[\w\.-]+\.\w{2,4}$') 
