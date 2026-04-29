from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas
from .security import get_password_hash


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_projects_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Project]:
    return (
        db.query(models.Project)
        .filter(models.Project.owner_id == user_id)
        .order_by(models.Project.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_project(db: Session, project: schemas.ProjectCreate, user_id: int) -> models.Project:
    db_project = models.Project(**project.dict(), owner_id=user_id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_project_by_id(db: Session, project_id: int) -> Optional[models.Project]:
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def update_project(db: Session, project: models.Project, payload: schemas.ProjectUpdate) -> models.Project:
    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: models.Project) -> None:
    db.delete(project)
    db.commit()


def create_protein_structure(
    db: Session,
    structure: schemas.ProteinStructureCreate,
    project_id: int,
) -> models.ProteinStructure:
    db_structure = models.ProteinStructure(**structure.dict(), project_id=project_id)
    db.add(db_structure)
    db.commit()
    db.refresh(db_structure)
    return db_structure


def get_structures_by_project(db: Session, project_id: int) -> List[models.ProteinStructure]:
    return (
        db.query(models.ProteinStructure)
        .filter(models.ProteinStructure.project_id == project_id)
        .order_by(models.ProteinStructure.created_at.desc())
        .all()
    )


def get_structure_by_id(db: Session, structure_id: int) -> Optional[models.ProteinStructure]:
    return (
        db.query(models.ProteinStructure)
        .filter(models.ProteinStructure.id == structure_id)
        .first()
    )


def delete_structure(db: Session, structure: models.ProteinStructure) -> None:
    db.delete(structure)
    db.commit()
