from fastapi import Depends, Request, APIRouter, HTTPException, status
from sqlalchemy.sql import select
from model.domain.book import BookD
from model.orm.book import BookORM
from model.base.base import db_session

router = APIRouter(prefix="/api")

@router.post("/echo", summary="Echo back validated book object")
async def echo(request: Request):
    try:
        body = await request.body()
        assert body is not None and len(body) > 0
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request body")

    return BookD.model_validate_json(body)

@router.get("/api/books", summary="Zwraca listę wszystkich książek")
async def get_books(db_session=Depends(db_session)):
    query = select(BookORM)
    result = await db_session.execute(query)
    return result.scalars().all()
