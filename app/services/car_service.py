from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Car
from ..schemas import CarCreate, CarUpdate


# Створення автомобіля
def create_car(session: Session, payload: CarCreate) -> Car:
    car = Car(**payload.model_dump())
    session.add(car)
    session.commit()
    session.refresh(car)
    return car

# Перелік автомобілів з фільтрами та пагінацією
def get_cars(
    session: Session,
    brand: str | None = None,
    fuel_type: str | None = None,
    min_release_year: int | None = None,
    limit: int = 20,
    offset: int = 0,
):
    stmt = select(Car)
    if brand is not None:
        stmt = stmt.where(Car.brand_model.ilike(f"{brand}%"))
    if fuel_type is not None:
        stmt = stmt.where(Car.fuel_type == fuel_type)
    if min_release_year is not None:
        stmt = stmt.where(Car.release_year >= min_release_year)
    stmt = stmt.order_by(Car.id).limit(limit).offset(offset)
    return list(session.scalars(stmt).all())

# Перегляд одного автомобіля
def get_car(session: Session, car_id: int) -> Car | None:
    return session.get(Car, car_id)

# Часткове оновлення автомобіля
def update_car(session: Session, car: Car, payload: CarUpdate) -> Car:
    changes_dict = payload.model_dump(exclude_unset=True)
    for field, value in changes_dict.items():
        setattr(car, field, value)
    session.commit()
    session.refresh(car)
    return car

# Видалення автомобіля
def delete_car(session: Session, car: Car) -> None:
    session.delete(car)
    session.commit()