# Car Catalog

Вебзастосунок для перегляду й керування каталогом автомобілів. Backend побудований на FastAPI та SQLAlchemy, frontend — на HTML, CSS і JavaScript, дані зберігаються у SQLite.

## Структура

- `app/main.py` — створює FastAPI-застосунок, підключає маршрути й віддає frontend.
- `app/routers/car.py` — HTTP-маршрути для створення, перегляду, редагування та видалення автомобілів.
- `app/services/car_service.py` — операції з автомобілями в базі даних.
- `app/models.py` — SQLAlchemy-моделі та типи даних.
- `app/schemas.py` — перевірка й формати даних API.
- `app/database.py`, `app/dependencies.py` — підключення до SQLite та сесії бази даних.
- `front/` — HTML, стилі й JavaScript інтерфейсу.

## Запуск

У корені проєкту виконайте:

```bash
uv sync
uv run uvicorn app.main:app --reload
```

Відкрийте <http://127.0.0.1:8000/>. Інтерактивна документація API доступна за адресою <http://127.0.0.1:8000/docs>.