from datetime import datetime, timedelta
from typing import Optional, Any
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from ..config import settings

# Initialize Argon2id password hasher with secure production parameters
hasher = PasswordHasher(
    time_cost=3,        # 3 iterations
    memory_cost=65536,  # 64 MB memory
    parallelism=4,      # 4 parallel threads
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hash a plain text password using Argon2id."""
    return hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against an Argon2id hash."""
    try:
        return hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
