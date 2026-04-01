from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class ProteinStructureBase(BaseModel):
    name: str
    pdb_file_path: str
    fasta_sequence: Optional[str] = None
    generation_params: Optional[dict] = None
    metrics: Optional[dict] = None

class ProteinStructureCreate(ProteinStructureBase):
    pass

class ProteinStructure(ProteinStructureBase):
    id: int
    project_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True