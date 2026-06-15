# app/core/security.py

from datetime import datetime, timezone, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

import secrets
import hashlib

# ── Password hashing ──────────────────────────────────────────
# CryptContext is passlib's way of managing hashing algorithms
# bcrypt is the industry standard for password hashing
# "deprecated='auto'" means if you switch algorithms later,
# old hashes are automatically marked as needing rehash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Converts plain text password into a bcrypt hash.
    Example:
        "MyPass@123" → "$2b$12$Kj3.../randomhashstring"
    This hash is what gets stored in DB — never the plain password.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks if plain text password matches the stored hash.
    bcrypt internally extracts the salt from the hash and
    re-hashes the plain password to compare.
    Returns True if match, False if wrong password.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT token ─────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    """
    Creates a signed JWT token.

    data example:
        {"sub": "22CS001", "user_type": "student"}

    What happens inside:
        1. Copies the data dict so we don't mutate the original
        2. Adds expiry time (current UTC + configured minutes)
        3. Signs it with SECRET_KEY using HS256 algorithm
        4. Returns a string like "eyJhbGci..."

    The token has 3 parts separated by dots:
        header.payload.signature
    Anyone can READ header and payload (base64 encoded)
    But only your server can VERIFY the signature
    """
    payload = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # "exp" is the JWT standard field for expiry
    # jose automatically checks this when decoding
    payload.update({"exp": expire})

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def decode_access_token(token: str) -> dict | None:
    """
    Decodes and validates a JWT token.

    What it checks automatically:
        1. Signature is valid (not tampered)
        2. Token is not expired

    Returns the payload dict if valid.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        # JWTError covers: expired, invalid signature, malformed
        return None
    

# ── Password reset token helpers ──────────────────────────────

def generate_reset_token() -> str:
    """
    Generates a secure random token sent to the user via email.
    URL-safe, 32 bytes → 43-character string.
    """
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """
    Hashes the token before storing in the database.
    We never store the raw token — only its SHA-256 hash.
    When the user clicks the link, we hash their token
    and compare against the stored hash.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_temp_password() -> str:
    """
    Generates a random temporary password for admin-initiated resets.
    Format guarantees it passes the password strength validator:
    - 12 chars total
    - At least 1 upper, 1 lower, 1 digit, 1 special
    """
    import random
    import string

    upper   = random.choice(string.ascii_uppercase)
    lower   = random.choice(string.ascii_lowercase)
    digit   = random.choice(string.digits)
    special = random.choice("!@#$%^&*")
    rest    = ''.join(random.choices(
        string.ascii_letters + string.digits, k=8
    ))

    password = upper + lower + digit + special + rest
    # Shuffle so it's not predictable pattern
    password_list = list(password)
    random.shuffle(password_list)
    return ''.join(password_list)