from pydantic import BaseModel, Field

class UserDTO(BaseModel):
    email: str = Field(pattern=r'^[\w\.-]+@[\w\.-]+\.\w{2,4}$') 
    password: str
