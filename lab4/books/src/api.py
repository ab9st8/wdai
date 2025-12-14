from pydantic import ValidationError
from fastapi import Depends, Request, APIRouter, HTTPException, status, Response
from sqlalchemy.sql import select, exists
from commons.model.domain.book import BookDTO
from commons.model.orm.book import Book
from commons.model.base.base import db_session

router = APIRouter(prefix="/api")

@router.get("/books", summary="Zwraca listę wszystkich książek")
async def get_books(db_session=Depends(db_session)):
    query = select(Book)
    result = db_session.execute(query)
    return result.scalars().all()

@router.get("/books/{book_id}", summary="Zwraca dane konkretnej książki")
async def get_book(book_id: int, db_session=Depends(db_session)):
    query = select(Book).where(Book.id == book_id)
    result = db_session.execute(query).scalar_one_or_none()
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return result

@router.head("/books/{book_id}", summary="Sprawdza, czy książka o podanym id istnieje")
async def head_book(book_id: int, db_session=Depends(db_session)):
    query = select(exists().where(Book.id == book_id))
    result = db_session.execute(query).scalar()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    return Response(status_code=status.HTTP_200_OK)

@router.post("/books", summary="Dodaje nową książkę (title, author, year) i zwraca jej id")
async def post_book(request: Request, db_session=Depends(db_session)):
    try:
        book = BookDTO.model_validate(await request.json())
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) 
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Something went wrong: {e}")

    new_book = Book(
        title=book.title,
        author=book.author,
        published_year=book.published_year
    )
    db_session.add(new_book)
    db_session.commit()
    db_session.refresh(new_book)
    return new_book.id

@router.delete("/books/{book_id}", summary="Usuwa książkę o podanym id")
async def delete_book(book_id: int, db_session=Depends(db_session)) -> Response:
    query = select(Book).where(Book.id == book_id)
    book = db_session.execute(query).scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    db_session.delete(book)
    db_session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)