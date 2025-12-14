from commons.base import Base
from .book import Book
from .user import User
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'schema': 'public'}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("public.users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("public.books.id"))
    quantity: Mapped[int]