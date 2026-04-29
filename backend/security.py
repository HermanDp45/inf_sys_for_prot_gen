import base64
import hashlib
import hmac
import os
import secrets

PBKDF2_ALGO = "sha256"
PBKDF2_ITERATIONS = int(os.environ.get("PBKDF2_ITERATIONS", "390000"))
PBKDF2_PREFIX = "pbkdf2_sha256"


def _b64_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64_decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + padding)


def get_password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(PBKDF2_ALGO, password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{PBKDF2_PREFIX}${PBKDF2_ITERATIONS}${_b64_encode(salt)}${_b64_encode(digest)}"


def _verify_pbkdf2(plain_password: str, hashed_password: str) -> bool:
    try:
        prefix, iter_raw, salt_raw, digest_raw = hashed_password.split("$", 3)
        if prefix != PBKDF2_PREFIX:
            return False

        iterations = int(iter_raw)
        salt = _b64_decode(salt_raw)
        expected_digest = _b64_decode(digest_raw)

        actual_digest = hashlib.pbkdf2_hmac(
            PBKDF2_ALGO,
            plain_password.encode("utf-8"),
            salt,
            iterations,
        )
        return hmac.compare_digest(actual_digest, expected_digest)
    except Exception:
        return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith(f"{PBKDF2_PREFIX}$"):
        return _verify_pbkdf2(plain_password, hashed_password)

    # Legacy fallback for old bcrypt hashes if passlib is present.
    if hashed_password.startswith("$2"):
        try:
            from passlib.context import CryptContext

            legacy_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return legacy_context.verify(plain_password, hashed_password)
        except Exception:
            return False

    return False
