import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    """User credentials for email and password authentication."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class RefreshTokenRequest(BaseModel):
    """Request payload to exchange refresh token for a new access token."""
    refresh_token: str


class UserRead(BaseModel):
    """User account response payload."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    _id: Optional[str] = None
    email: EmailStr
    full_name: str
    role: str
    business_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

    def model_post_init(self, __context):
        if not self._id:
            self._id = str(self.id)


class TokenResponse(BaseModel):
    """Authentication tokens returned upon successful login."""
    access_token: str
    refresh_token: str
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserRead

    def model_post_init(self, __context):
        # Provide camelCase aliases for frontend compatibility
        if not self.accessToken:
            self.accessToken = self.access_token
        if not self.refreshToken:
            self.refreshToken = self.refresh_token


class UserProfileResponse(BaseModel):
    """Profile payload compatible with frontend user profile fetching."""
    user: UserRead
    business: Optional[dict] = None
    workspace: Optional[dict] = None

    def model_post_init(self, __context):
        # Provide workspace alias for legacy frontend compatibility
        if not self.workspace and self.business:
            self.workspace = self.business
