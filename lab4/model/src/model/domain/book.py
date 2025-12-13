from datetime import date
from pydantic import BaseModel, Field

class BookD(BaseModel):
    title: str
    author: str
    published_year: int = Field(int, ge=0, le=date.today().year)
