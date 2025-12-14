from pydantic_core import ValidationError
import requests
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.sql import select, exists

from commons.orm.order import Order
from commons.domain.order import OrderDTO
from commons.base import db_session


router = APIRouter(prefix="/api")


@router.get("/orders/{user_id}", summary="Zwraca listę zamówień użytkownika")
async def get_orders(user_id: int, db_session=Depends(db_session)):
    query = select(Order).where(Order.user_id == user_id)
    result = db_session.execute(query)
    return result.scalars().all()


@router.post(
    "/orders",
    summary="Dodaje zamówienie (userId, bookId, quantity) i zwraca id zamówienia. Sprawdź, czy bookId istnieje (należy wykorzystać serwis 1. Nie wykonywać bezpośrednio zapytania do bazy!).",
)
async def post_order(request: Request, db_session=Depends(db_session)):
    try:
        order = OrderDTO.model_validate(await request.json())
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong: {e}",
        )

    book_response = requests.head(f"http://books:3000/api/books/{order.book_id}")
    if book_response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Book ID does not exist"
        )
    elif book_response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Something went wrong validating if book id {order.book_id} exists: {book_response.text}",
        )

    user_response = requests.head(f"http://users:3000/api/users/{order.user_id}")
    if user_response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User ID does not exist"
        )
    elif user_response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong validating if user id {order.user_id} exists: {user_response.text}",
        )

    new_order = Order(
        user_id=order.user_id, book_id=order.book_id, quantity=order.quantity
    )

    db_session.add(new_order)
    db_session.commit()
    db_session.refresh(new_order)
    return new_order.id


@router.delete("/orders/{order_id}", summary="Usuwa zamówienie o podanym id")
async def delete_order(order_id: int, db_session=Depends(db_session)):
    query = select(Order).where(Order.id == order_id)
    result = db_session.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    db_session.delete(order)
    db_session.commit()
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT)


@router.head(
    "/orders/{order_id}", summary="Sprawdza, czy zamówienie o podanym id istnieje"
)
async def head_order(order_id: int, db_session=Depends(db_session)):
    query = select(exists().where(Order.id == order_id))
    result = db_session.execute(query).scalar()
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    return JSONResponse(status_code=status.HTTP_200_OK, content=None)


@router.patch("/orders/{order_id}", summary="Aktualizuje ilość książek w zamówieniu")
async def update_order_quantity(
    request: Request, order_id: int, db_session=Depends(db_session)
):
    try:
        order = OrderDTO.model_validate(await request.json())
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request data: {e}",
        )

    query = select(Order).where(Order.id == order_id)
    result = db_session.execute(query)
    order_orm = result.scalar_one_or_none()
    if not order_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    order_orm.user_id = order.user_id
    order_orm.book_id = order.book_id
    order_orm.quantity = order.quantity
    db_session.commit()
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT)
