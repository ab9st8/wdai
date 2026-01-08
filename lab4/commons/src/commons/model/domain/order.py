from pydantic import BaseModel, Field

class OrderDTO(BaseModel):
    user_id: int
    book_id: int
    quantity: int = Field(gt=0)
