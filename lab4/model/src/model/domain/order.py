from pydantic import BaseModel

from model.domain.book import BookD
from model.domain.user import UserD

class OrderD(BaseModel):
    user: UserD
    book: BookD
    quantity: int
