import json
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .database import engine, get_db
from .utils import generate_mock_pdb

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Protein Design Information System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://molstar.org",
        "https://www.molstar.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


AMINO_ACIDS = ["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"]
RESIDUE_TO_AA = {
    "ALA": "A",
    "ARG": "R",
    "ASN": "N",
    "ASP": "D",
    "CYS": "C",
    "GLN": "Q",
    "GLU": "E",
    "GLY": "G",
    "HIS": "H",
    "ILE": "I",
    "LEU": "L",
    "LYS": "K",
    "MET": "M",
    "PHE": "F",
    "PRO": "P",
    "SER": "S",
    "THR": "T",
    "TRP": "W",
    "TYR": "Y",
    "VAL": "V",
}


@app.get("/")
def root() -> Dict[str, str]:
    return {"service": "protein-design-system", "status": "ok"}


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "healthy"}


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.get("/users/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/projects/", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_projects_by_user(db, current_user.id, skip, limit)


@app.post("/projects/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_project(db, project, current_user.id)


@app.get("/projects/{project_id}", response_model=schemas.Project)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = _get_project_or_404(db, project_id, current_user.id)
    return project


@app.put("/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = _get_project_or_404(db, project_id, current_user.id)
    return crud.update_project(db, project, payload)


@app.delete("/projects/{project_id}", response_model=schemas.MessageResponse)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = _get_project_or_404(db, project_id, current_user.id)
    for structure in list(project.protein_structures):
        _delete_structure_file(structure.pdb_file_path)
    crud.delete_project(db, project)
    return {"status": "success", "detail": "Project deleted"}


@app.get("/projects/{project_id}/protein-structures/", response_model=List[schemas.ProteinStructure])
def list_project_structures(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_project_or_404(db, project_id, current_user.id)
    structures = crud.get_structures_by_project(db, project_id)
    for structure in structures:
        structure.pdb_file_path = _normalize_public_path(structure.pdb_file_path)
    return structures


@app.post("/projects/{project_id}/generate-protein/", response_model=schemas.ProteinStructure)
async def generate_protein(
    project_id: int,
    params: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = _get_project_or_404(db, project_id, current_user.id)
    generation_params = _parse_generation_params(params)
    structure = _create_generated_structure(db, project.id, generation_params, name_prefix="Generated")
    structure.pdb_file_path = _normalize_public_path(structure.pdb_file_path)
    return structure


@app.post("/projects/{project_id}/generate-protein-async/", response_model=schemas.TaskResponse)
async def generate_protein_async_endpoint(
    project_id: int,
    params: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_project_or_404(db, project_id, current_user.id)
    generation_params = _parse_generation_params(params)

    try:
        from .celery_worker import celery

        task = celery.send_task(
            "generate_protein_async",
            args=[project_id, current_user.id, generation_params],
        )
        return {"task_id": task.id, "status": "queued"}
    except Exception:
        # Graceful fallback for local demo without Redis/Celery.
        structure = _create_generated_structure(db, project_id, generation_params, name_prefix="GeneratedSync")
        return {
            "task_id": f"sync-{structure.id}",
            "status": "completed",
        }


@app.get("/tasks/{task_id}", response_model=schemas.TaskStatusResponse)
def get_task_status(task_id: str):
    if task_id.startswith("sync-"):
        return {"task_id": task_id, "status": "SUCCESS", "result": {"mode": "sync"}}

    try:
        from celery.result import AsyncResult
        from .celery_worker import celery

        result = AsyncResult(task_id, app=celery)
        payload = result.result if isinstance(result.result, dict) else None
        return {
            "task_id": task_id,
            "status": result.status,
            "result": payload,
        }
    except Exception:
        return {
            "task_id": task_id,
            "status": "UNAVAILABLE",
            "result": {"detail": "Celery is not configured on this environment"},
        }


@app.post("/projects/{project_id}/upload-protein/", response_model=schemas.ProteinStructure)
async def upload_protein(
    project_id: int,
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_project_or_404(db, project_id, current_user.id)

    if not name.strip():
        raise HTTPException(status_code=400, detail="Structure name is required")

    filename = file.filename or ""
    if not filename.lower().endswith(".pdb"):
        raise HTTPException(status_code=400, detail="Only .pdb files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File is too large (max 10 MB)")

    file_id = f"{uuid.uuid4()}.pdb"
    storage_path = UPLOAD_DIR / file_id
    storage_path.write_bytes(content)

    pdb_text = content.decode("utf-8", errors="ignore")
    fasta_sequence = _extract_sequence_from_pdb(pdb_text)

    structure_data = schemas.ProteinStructureCreate(
        name=name.strip(),
        pdb_file_path=f"/uploads/{file_id}",
        fasta_sequence=fasta_sequence,
        generation_params={"source": "upload", "uploaded_at": datetime.utcnow().isoformat()},
        metrics={
            "upload_time": datetime.utcnow().isoformat(),
            "realism_score": 0.75,
            "pLDDT": None,
            "sc_rmsd": None,
            "generation_time": "uploaded",
        },
    )

    structure = crud.create_protein_structure(db, structure_data, project_id)
    structure.pdb_file_path = _normalize_public_path(structure.pdb_file_path)
    return structure


@app.get("/protein-structures/{structure_id}", response_model=schemas.ProteinStructure)
def get_protein_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    structure = _get_structure_or_404(db, structure_id, current_user.id)
    structure.pdb_file_path = _normalize_public_path(structure.pdb_file_path)
    return structure


@app.delete("/protein-structures/{structure_id}", response_model=schemas.MessageResponse)
def delete_protein_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    structure = _get_structure_or_404(db, structure_id, current_user.id)
    _delete_structure_file(structure.pdb_file_path)
    crud.delete_structure(db, structure)
    return {"status": "success", "detail": "Protein structure deleted"}


def _get_project_or_404(db: Session, project_id: int, owner_id: int) -> models.Project:
    project = crud.get_project_by_id(db, project_id)
    if project is None or project.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_structure_or_404(db: Session, structure_id: int, owner_id: int) -> models.ProteinStructure:
    structure = crud.get_structure_by_id(db, structure_id)
    if structure is None:
        raise HTTPException(status_code=404, detail="Structure not found")

    project = crud.get_project_by_id(db, structure.project_id)
    if project is None or project.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Structure not found")

    return structure


def _parse_generation_params(params: str) -> Dict[str, object]:
    try:
        payload = json.loads(params)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON in generation params") from exc

    length = int(payload.get("length", 120))
    quality = float(payload.get("quality", 0.8))
    mode = str(payload.get("mode", "generate"))

    if length < 50 or length > 500:
        raise HTTPException(status_code=400, detail="Protein length must be between 50 and 500")
    if quality < 0.1 or quality > 1.0:
        raise HTTPException(status_code=400, detail="Quality must be between 0.1 and 1.0")

    payload["length"] = length
    payload["quality"] = round(quality, 2)
    payload["mode"] = mode
    payload.setdefault("created_at", datetime.utcnow().isoformat())
    payload.setdefault("source", "generation")
    return payload


def _create_generated_structure(
    db: Session,
    project_id: int,
    generation_params: Dict[str, object],
    name_prefix: str,
) -> models.ProteinStructure:
    length = int(generation_params.get("length", 120))
    quality = float(generation_params.get("quality", 0.8))

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
    }

    structure_data = schemas.ProteinStructureCreate(
        name=f"{name_prefix}_{uuid.uuid4().hex[:8]}",
        pdb_file_path=f"/uploads/{file_id}",
        fasta_sequence=sequence,
        generation_params=generation_params,
        metrics=metrics,
    )
    return crud.create_protein_structure(db, structure_data, project_id)


def _normalize_public_path(value: str) -> str:
    if value.startswith("/uploads/"):
        return value
    if value.startswith("uploads/"):
        return f"/{value}"
    filename = os.path.basename(value)
    return f"/uploads/{filename}"


def _resolve_storage_path(value: str) -> Path:
    if value.startswith("/uploads/"):
        return BASE_DIR / value.lstrip("/")
    if value.startswith("uploads/"):
        return BASE_DIR / value
    if os.path.isabs(value):
        return Path(value)
    return UPLOAD_DIR / value


def _delete_structure_file(path_value: str) -> None:
    try:
        storage_path = _resolve_storage_path(path_value)
        if storage_path.exists():
            storage_path.unlink()
    except Exception:
        # File cleanup should not block API response.
        return


def _extract_sequence_from_pdb(pdb_text: str) -> str:
    residues = []
    seen_positions = set()

    for line in pdb_text.splitlines():
        if not line.startswith("ATOM"):
            continue
        if len(line) < 27:
            continue
        residue = line[17:20].strip().upper()
        chain = line[21:22]
        position = line[22:26].strip()
        key = (chain, position)
        if key in seen_positions:
            continue
        seen_positions.add(key)
        residues.append(RESIDUE_TO_AA.get(residue, "X"))

    return "".join(residues) or "Sequence unavailable"
