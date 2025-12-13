from contextlib import contextmanager
from functools import cache
import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


@cache
def engine():
    return create_engine(
        os.getenv("DATABASE_URL"),
        echo=True,
    )


# Create a configured "Session" class
_session_factory = sessionmaker(
    bind=engine(), class_=Session, autoflush=False, autocommit=False
)


def db_session() -> Session:
    """
    Meant to be used within FastAPI.
    """
    with _session_factory() as session:
        try:
            yield session
            session.commit()
        finally:
            session.close()


db_session_cm = contextmanager(db_session)
