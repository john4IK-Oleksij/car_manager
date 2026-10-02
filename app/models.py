import datetime
import enum

from sqlalchemy import JSON, Numeric, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class FuelType(str, enum.Enum):
    petrol = "petrol"
    diesel = "diesel"
    electric = "electric"
    hybrid = "hybrid"


class Car(Base):
    __tablename__ = "cars"

    # унікальний номер автомобіля
    id: Mapped[int] = mapped_column(primary_key=True)

    # марка та модель автомобіля
    brand_model: Mapped[str] = mapped_column(String(150))

    # ім’я виробника або дилера
    manufacturer: Mapped[str] = mapped_column(String(150))

    # VIN
    vin: Mapped[str] = mapped_column(String(17), unique=True)

    # тип кузова
    body_type: Mapped[str] = mapped_column(String(50))

    # тип пального
    fuel_type: Mapped[FuelType] = mapped_column(SqlEnum(FuelType))

    # об'єм двигуна у літрах
    engine_volume: Mapped[float | None] = mapped_column(default=None)

    # вартість автомобіля
    price: Mapped[float] = mapped_column(Numeric(12, 2))

    # оцінка від експертів чи покупців
    rating: Mapped[float | None] = mapped_column(default=None)

    # чи доступний автомобіль
    is_available: Mapped[bool] = mapped_column(default=True)

    # короткий опис
    description: Mapped[str | None] = mapped_column(Text, default=None)

    # рік випуску
    release_year: Mapped[int]

    # коли доданий у систему
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now()
    )

    # додаткові опції / мітки
    options: Mapped[list[str] | None] = mapped_column(JSON, default=None)