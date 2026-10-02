from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError

from .. import schemas
from ..dependencies import SessionDep
from ..services import car_service

router = APIRouter(prefix="/cars", tags=["cars"])


@router.post(
    "/", response_model=schemas.CarResponse, status_code=status.HTTP_201_CREATED
)
def create_car(payload: schemas.CarCreate, db: SessionDep):
    try:
        return car_service.create_car(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Car VIN already exists",
        )


@router.get("/", response_model=list[schemas.CarResponse])
def read_cars(
    db: SessionDep,
    brand: str | None = None,
    fuel_type: str | None = None,
    min_release_year: int | None = None,
    limit: int = 20,
    offset: int = 0,
):
    return car_service.get_cars(
        db, brand, fuel_type, min_release_year, limit, offset
    )


@router.get("/{car_id}", response_model=schemas.CarResponse)
def read_car(car_id: int, db: SessionDep):
    car = car_service.get_car(db, car_id)

    if car is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    return car


@router.patch("/{car_id}", response_model=schemas.CarResponse)
def update_car(
    car_id: int,
    payload: schemas.CarUpdate,
    db: SessionDep,
):
    car = car_service.get_car(db, car_id)

    if car is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    try:
        return car_service.update_car(db, car, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Car VIN already exists",
        )


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: int, db: SessionDep):
    car = car_service.get_car(db, car_id)

    if car is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    car_service.delete_car(db, car)