import os
import time
import uuid
from datetime import datetime
from pathlib import Path

from celery import Celery

from . import crud, schemas
from .database import SessionLocal
from .utils import generate_mock_pdb

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

AMINO_ACIDS = ["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"]

celery = Celery(__name__)
celery.conf.update(
    broker_url=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    result_backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
)


@celery.task(name="generate_protein_async")
def generate_protein_async(project_id: int, user_id: int, generation_params: dict):
    db = SessionLocal()
    try:
        length = int(generation_params.get("length", 120))
        quality = float(generation_params.get("quality", 0.8))

        # Simulate long-running generation.
        time.sleep(3)

        pdb_content = generate_mock_pdb(length)
        file_id = f"{uuid.uuid4()}.pdb"
        storage_path = UPLOAD_DIR / file_id
        storage_path.write_text(pdb_content, encoding="utf-8")

        sequence = "".join(AMINO_ACIDS[i % len(AMINO_ACIDS)] for i in range(length))

        metrics = {
            "sc_rmsd": round(1.8 - 0.8 * quality, 3),
            "pLDDT": round(70 + (quality * 25), 2),
            "generation_time": f"{round(1.2 + (1.0 - quality) * 3, 2)}s",
            "realism_score": round(0.55 + quality * 0.4, 3),
            "completed_at": datetime.utcnow().isoformat(),
        }

        structure_data = schemas.ProteinStructureCreate(
            name=f"Async_{uuid.uuid4().hex[:8]}",
            pdb_file_path=f"/uploads/{file_id}",
            fasta_sequence=sequence,
            generation_params={**generation_params, "source": "generation"},
            metrics=metrics,
        )

        crud.create_protein_structure(db, structure_data, project_id)
        return {"status": "success", "project_id": project_id}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
    finally:
        db.close()
