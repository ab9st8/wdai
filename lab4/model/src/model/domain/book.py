from datetime import date
from pydantic import BaseModel

class BookD(BaseModel):
    title: str
    author: str
    published_year: date
