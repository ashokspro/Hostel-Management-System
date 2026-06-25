from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

class Base(DeclarativeBase):
    pass

engine = create_async_engine(
    str(settings.DATABASE_URL),
    connect_args={
        "statement_cache_size": 0,
    },
)
AsyncSessionLocal  = async_sessionmaker(autoflush=False, autocommit=False, bind=engine, expire_on_commit=False) 

async def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()