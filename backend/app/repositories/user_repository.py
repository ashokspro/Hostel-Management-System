# app/repositories/user_repository.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.models.user import User
from datetime import datetime, timezone, timedelta

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
    
    @staticmethod
    async def get_by_reset_token_hash(db: AsyncSession, token_hash: str) -> User | None:
        """Finds a user by their stored reset token hash."""
        result = await db.execute(
            select(User).where(User.reset_token_hash == token_hash)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def count_by_type(db: AsyncSession, user_type: str) -> int:
        result = await db.scalar(
            select(func.count(User.id)).where(User.user_type == user_type)
        )
        return result or 0
    
    @staticmethod
    async def get_admin_stats(db: AsyncSession) -> dict:
        now_utc = datetime.now(timezone.utc)
        today_start = datetime(now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc)
        week_start  = today_start - timedelta(days=now_utc.weekday())
        month_start = datetime(now_utc.year, now_utc.month, 1, tzinfo=timezone.utc)
        epoch       = datetime(2000, 1, 1, tzinfo=timezone.utc)  # "overall" = since epoch

        async def period_stats(start: datetime) -> dict:
            async def count(role: str) -> int:
                return await db.scalar(
                    select(func.count(User.id))
                    .where(User.user_type == role, User.created_at >= start)
                ) or 0

            return {
                "new_students": await count("student"),
                "new_wardens":  await count("warden"),
                "new_security": await count("security"),
                "new_admins":   await count("admin"),
            }

        today   = await period_stats(today_start)
        week    = await period_stats(week_start)
        month   = await period_stats(month_start)
        overall = await period_stats(epoch)

        async def active_count(role: str) -> int:
            return await db.scalar(
                select(func.count(User.id))
                .where(User.user_type == role, User.is_active == True)
            ) or 0

        return {
            "live": {
                "active_students": await active_count("student"),
                "active_wardens":  await active_count("warden"),
                "active_security": await active_count("security"),
                "active_admins":   await active_count("admin"),
                "total_users": await db.scalar(select(func.count(User.id))) or 0,
            },
            "today": today,
            "week": week,
            "month": month,
            "overall": overall,
        }