from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from . import models, schemas, crud, auth
from .database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session
import os
import uuid
from .utils import generate_mock_pdb


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Protein Design System")

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: `get_db` is provided by `backend.database.get_db`

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

from .schemas import ProteinStructureCreate

@app.post("/projects/{project_id}/generate-protein/", response_model=schemas.ProteinStructure)
async def generate_protein(
    project_id: int,
    params: str = Form(...),  # JSON string with generation params
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    # Заглушка для генерации
    project = crud.get_project_by_id(db, project_id)
    if project is None or project.owner_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Simulate generation parameters
    import json
    generation_params = json.loads(params)
    
    # Generate mock structure (in real app, this would call SALAD model)
    mock_pdb_content = generate_mock_pdb(generation_params.get("length", 100))
    
    # Save to file
    filename = f"{uuid.uuid4()}.pdb"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "w") as f:
        f.write(mock_pdb_content)
    
    # Create mock metrics
    mock_metrics = {
        "sc_rmsd": round(1.2 + (0.5 * (1 - generation_params.get("quality", 0.7))), 2),
        "pLDDT": round(85 + (10 * generation_params.get("quality", 0.7)), 2),
        "generation_time": "2.5s",
        "realism_score": round(0.8 + (0.1 * generation_params.get("quality", 0.7)), 2)
    }
    
    structure_data = ProteinStructureCreate(
        name=f"Generated_Protein_{uuid.uuid4().hex[:6]}",
        pdb_file_path=filepath,
        fasta_sequence="".join(["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"][i % 20] for i in range(generation_params.get("length", 100))),
        generation_params=generation_params,
        metrics=mock_metrics
    )
    
    return crud.create_protein_structure(db, structure_data, project_id)

@app.post("/projects/{project_id}/upload-protein/", response_model=schemas.ProteinStructure)
async def upload_protein(
    project_id: int,
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    project = crud.get_project_by_id(db, project_id)
    if project is None or project.owner_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Save uploaded file
    filename_str = file.filename or ""
    file_extension = os.path.splitext(filename_str)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create structure record
    structure_data = ProteinStructureCreate(
        name=name,
        pdb_file_path=filepath,
        fasta_sequence="Uploaded sequence (to be extracted from PDB)",
        generation_params={"source": "upload"},
        metrics={"upload_time": datetime.utcnow().isoformat()}
    )
    
    return crud.create_protein_structure(db, structure_data, project_id)



from .celery_worker import celery

@app.post("/projects/{project_id}/generate-protein-async/")
async def generate_protein_async_endpoint(
    project_id: int,
    params: str = Form(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_user)
):
    project = crud.get_project_by_id(db, project_id)
    if project is None or project.owner_id != current_user.id:  # type: ignore
        raise HTTPException(status_code=404, detail="Project not found")
    
    import json
    generation_params = json.loads(params)
    
    # Queue the task
    task = celery.send_task(
        "generate_protein_async",
        args=[project_id, current_user.id, generation_params]
    )
    
    return {"task_id": task.id, "status": "queued"}