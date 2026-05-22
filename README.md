# Protein Design Information System

Дипломный fullstack-проект: информационная система для управления проектами по генерации и анализу белков.

## Что реализовано

- Регистрация и авторизация пользователей (JWT).
- Личный кабинет пользователя.
- Вкладка проектов: создание, просмотр, редактирование, удаление.
- В рамках проекта:
  - генерация нового белка по параметрам;
  - сценарий "модификации" через параметры генерации;
  - загрузка готового `.pdb` файла;
  - список созданных/загруженных структур с метриками.
- 3D-визуализация структуры на отдельной странице (Mol* viewer).
- Хранение пользователей/проектов/структур в SQLite.

## Стек

- Frontend: React + React Router + Axios
- Backend: FastAPI + SQLAlchemy
- DB: SQLite (`app.db`)
- Async (опционально): Celery + Redis (если не запущены, API использует fallback в синхронный режим)
- 3D-viewer: локальная сборка Mol* в `frontend/public/molstar`

## Документация для диплома

- Полная схема информационной системы в draw.io: `docs/system-architecture.drawio`
- Русифицированная версия схемы для диплома: `docs/system-architecture-ru.drawio`
- В схеме отражены пользователь, React SPA, FastAPI API, JWT-защита, SQLite, файловое хранилище PDB, Mol* viewer и опциональный контур Redis/Celery.

## Быстрый запуск

### 1) Backend

```bash
source backend/venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

API будет доступно на `http://localhost:8000`.

### 2) Frontend

```bash
cd frontend
npm start
```

UI будет доступен на `http://localhost:3000`.

## Опционально: Celery worker

Если нужен асинхронный режим генерации через очередь:

```bash
redis-server
```

```bash
source backend/venv/bin/activate
celery -A backend.celery_worker.celery worker --loglevel=info
```

## Полезные эндпоинты

- `POST /users/` — регистрация
- `POST /token` — вход
- `GET /users/me` — профиль
- `GET/POST /projects/`
- `GET/PUT/DELETE /projects/{project_id}`
- `GET /projects/{project_id}/protein-structures/`
- `POST /projects/{project_id}/generate-protein-async/`
- `POST /projects/{project_id}/upload-protein/`
- `GET/DELETE /protein-structures/{structure_id}`
