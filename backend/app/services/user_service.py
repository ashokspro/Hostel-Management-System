# app/services/user_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.security import hash_password
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse


class UserService:
    """
    ALL business logic for users lives here.
    
    Business logic means:
        - Rules ("ID must be unique")
        - Decisions ("should we allow this?")
        - Orchestration (calls repository + security together)
    
    NOT responsible for:
        - HTTP (that's routers)
        - DB queries (that's repository)
        - Password algorithm (that's security.py)
    """

    @staticmethod
    async def create_user(
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """
        Creates a new user.
        
        Rules enforced here:
            1. User ID must not already exist
            2. Email must not already be taken (if provided)
            3. Password gets hashed — never stored plain
        """
        # Rule 1 — check ID uniqueness
        if await UserRepository.exists(db, user_data.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with ID '{user_data.id}' already exists"
            )

        # Rule 2 — check email uniqueness
        if user_data.email:
            existing_email = await UserRepository.get_by_email(db, user_data.email)
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is already registered"
                )

        # Rule 3 — hash password before storing
        # model_dump() converts Pydantic schema to a plain dict
        # exclude={"password"} removes plain password from dict
        user_dict = user_data.model_dump(exclude={"password"})

        user = User(
            **user_dict,
            # Store the hash, never the plain password
            password_hash=hash_password(user_data.password)
        )

        return await UserRepository.create(db, user)

    @staticmethod
    async def get_user(
        db: AsyncSession,
        user_id: str
    ) -> User:
        """
        Fetch a user by ID.
        Raises 404 if not found — so routers don't need to check.
        """
        user = await UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_id}' not found"
            )
        return user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        update_data: UserUpdate
    ) -> User:
        """
        Updates a user's profile.
        
        Key pattern — PATCH semantics:
            Only update fields that were actually sent.
            exclude_unset=True means "ignore fields the
            client didn't include in the request body"
        
        Example:
            Client sends: {"name": "John"}
            Only name gets updated — email, phone etc unchanged
        """
        user = await UserService.get_user(db, user_id)

        # exclude_unset=True — only fields client actually sent
        # exclude_none=True — skip fields that are None
        update_dict = update_data.model_dump(
            exclude_unset=True,
            exclude_none=True
        )

        # setattr dynamically sets each field on the user object
        # Same as: user.name = "John", user.email = "..." etc
        for field, value in update_dict.items():
            setattr(user, field, value)

        return await UserRepository.update(db, user)

    @staticmethod
    async def toggle_active(
        db: AsyncSession,
        user_id: str,
        is_active: bool
    ) -> User:
        """
        Activate or deactivate a user account.
        
        We use soft delete — never actually delete from DB.
        is_active=False means deactivated.
        Deactivated users cannot login (auth_service checks this).
        """
        user = await UserService.get_user(db, user_id)
        user.is_active = is_active
        return await UserRepository.update(db, user)

    @staticmethod
    async def get_students(
        db: AsyncSession,
        search: str | None = None,
        year: str | None = None,
        course: str | None = None,
        is_active: bool | None = None
    ) -> list[User]:
        """
        Get students with optional filters.
        Just passes filters down to repository.
        Service layer doesn't need extra logic here.
        """
        return await UserRepository.get_students_filtered(
            db,
            search=search,
            year=year,
            course=course,
            is_active=is_active
        )
    
    @staticmethod
    async def get_users_by_type(
        db: AsyncSession,
        user_type: str
    ) -> list[User]:
        """
        Get all users of a specific type.
        Validates user_type is valid before querying.
        """
        from app.core.constants import UserRole
        valid_types = [r.value for r in UserRole]
        if user_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user type. Must be one of: {valid_types}"
            )
        return await UserRepository.get_by_user_type(db, user_type)
    
    @staticmethod
    async def get_admin_stats(db: AsyncSession) -> dict:
        return await UserRepository.get_admin_stats(db)