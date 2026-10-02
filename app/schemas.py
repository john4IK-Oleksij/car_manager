from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import FuelType


class CarBase(BaseModel):
    brand_model: str = Field(min_length=2, max_length=150)
    manufacturer: str = Field(min_length=1, max_length=150)
    vin: str = Field(pattern=r"^[A-HJ-NPR-Z0-9]{17}$")
    body_type: str = Field(min_length=2, max_length=50)
    fuel_type: FuelType
    engine_volume: float | None = Field(default=None, gt=0)
    price: float = Field(ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    description: str | None = Field(default=None, max_length=1000)
    release_year: int
    options: list[str] | None = Field(default=None, max_length=10)


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand_model: str | None = Field(default=None, min_length=2, max_length=150)
    manufacturer: str | None = Field(default=None, min_length=1, max_length=150)
    vin: str | None = Field(
        default=None,
        pattern=r"^[A-HJ-NPR-Z0-9]{17}$",
    )
    body_type: str | None = Field(default=None, min_length=2, max_length=50)
    fuel_type: FuelType | None = None
    engine_volume: float | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    description: str | None = Field(default=None, max_length=1000)
    release_year: int | None = None
    options: list[str] | None = Field(default=None, max_length=10)
    is_available: bool | None = None


class CarResponse(CarBase):
    id: int
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)