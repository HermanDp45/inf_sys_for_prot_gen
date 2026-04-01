# inf_sys_for_prot_gen
information system for protein generation

## Starting

### backend

**Terminal 1: server**
```bash
 source backend/venv/bin/activate && uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Celery worker**
```bash
cd backend
source venv/bin/activate
npm run celery
```

```bash
redis-server
```

```bash
 source backend/venv/bin/activate && celery -A backend.celery_worker.celery worker --loglevel=info
```

# Terminal 3: Frontend
```bash
cd frontend
npm start
```

# Terminal 4: Redis (если не запущен как сервис)
redis-server


