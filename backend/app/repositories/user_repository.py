# app/repositories/user_repository.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.user import User


class UserRepository:
    """
    ALL database operations for User live here.
    No business logic — just pure DB queries.
    
    Think of this as the "database layer" —
    it only knows how to talk to PostgreSQL,
    not WHY or WHEN to do it.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
        """
        Fetch single user by ID.
        Returns None if not found — caller decides what to do.
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        """
        Fetch single user by email.
        Used to prevent duplicate emails during creation.
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_students(db: AsyncSession) -> list[User]:
        """
        Fetch ALL students — no filters.
        Used by warden dashboard overview.
        """
        result = await db.execute(
            select(User).where(User.user_type == "student")
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_students_filtered(
        db: AsyncSession,
        search: str | None = None,
        year: str | None = None,
        course: str | None = None,
        is_active: bool | None = None
    ) -> list[User]:
        """
        Fetch students with optional filters.
        
        How filters work:
            - Each filter is optional — None means "don't filter by this"
            - Multiple filters stack (AND logic)
            - search checks name, ID, and room simultaneously (OR logic)
        
        Example:
            get_students_filtered(db, year="2nd Year", search="john")
            → students in 2nd year AND (name OR id OR room contains "john")
        """
        # Start with base query — all students
        query = select(User).where(User.user_type == "student")

        # Stack filters only if provided
        if search:
            # or_() means ANY of these conditions can match
            # ilike() is case-insensitive LIKE — "john" matches "John"
            query = query.where(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.id.ilike(f"%{search}%"),
                    User.room.ilike(f"%{search}%")
                )
            )

        if year:
            query = query.where(User.year == year)

        if course:
            query = query.where(User.course.ilike(f"%{course}%"))

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        # Order by name alphabetically
        query = query.order_by(User.name)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_users(db: AsyncSession) -> list[User]:
        """
        Fetch ALL users regardless of type.
        Used by admin panel.
        """
        result = await db.execute(select(User).order_by(User.user_type))
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, user: User) -> User:
        """
        Save a NEW user to DB.
        
        Steps:
            1. db.add() — SQLAlchemy starts tracking this object
            2. db.commit() — writes INSERT to PostgreSQL
            3. db.refresh() — reloads from DB to get
               server-generated values (created_at, updated_at)
        """
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update(db: AsyncSession, user: User) -> User:
        """
        Save CHANGES to existing user.
        
        SQLAlchemy already tracks this object (it came from a query),
        so we just commit the changes and refresh.
        No need to db.add() again.
        """
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def exists(db: AsyncSession, user_id: str) -> bool:
        """
        Check if user ID is already taken.
        Used before creating a new user to prevent duplicates.
        
        We only select the ID column — faster than selecting all columns
        when we only need to know IF the row exists.
        """
        result = await db.execute(
            select(User.id).where(User.id == user_id)
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    async def get_by_user_type(db: AsyncSession, user_type: str) -> list[User]:
        """
        Fetch all users of a specific type.
        Used for listing wardens, security staff separately.
        """
        result = await db.execute(
            select(User)
            .where(User.user_type == user_type)
            .order_by(User.name)
        )
        return list(result.scalars().all())