from contextlib import contextmanager
from functools import cache
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, sessionmaker


class Base(DeclarativeBase):
    pass

@cache
def engine():
    engine = create_engine(
        "postgresql+psycopg2://postgres:postgres@localhost:5432/lab4",
        echo=True,
    )
    @event.listens_for(engine, "do_connect")
    def _on_connect(_dialect, _conn_rec, _cargs, _cparams):
        _cparams["user"] = "postgres"
        _cparams["password"] = "postgres"

    return engine

# Create a configured "Session" class
_session_factory  = sessionmaker(engine=engine(), bind=None, class_=Session, autoflush=False, autocommit=False)

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