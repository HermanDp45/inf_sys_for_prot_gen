import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { projectApi, proteinApi } from '../utils/api';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('structures');
  const [error, setError] = useState('');

  const [savingProject, setSavingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
  });

  const [generating, setGenerating] = useState(false);
  const [generationForm, setGenerationForm] = useState({
    mode: 'generate',
    length: 160,
    quality: 0.8,
    symmetry: 'none',
    conditions: '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectData, structuresData] = await Promise.all([
        projectApi.getById(projectId),
        proteinApi.getByProject(projectId),
      ]);
      setProject(projectData);
      setStructures(Array.isArray(structuresData) ? structuresData : []);
      setProjectForm({
        name: projectData.name || '',
        description: projectData.description || '',
      });
    } catch (apiError) {
      setError(apiError.message || 'Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveProject = async (event) => {
    event.preventDefault();
    if (!projectForm.name.trim()) {
      return;
    }

    setSavingProject(true);
    setError('');
    try {
      const updated = await projectApi.update(projectId, {
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
      });
      setProject(updated);
      window.alert('Проект сохранен');
    } catch (apiError) {
      setError(apiError.message || 'Не удалось сохранить проект');
    } finally {
      setSavingProject(false);
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const payload = {
        mode: generationForm.mode,
        length: Number(generationForm.length),
        quality: Number(generationForm.quality),
        symmetry: generationForm.symmetry,
        conditions: generationForm.conditions,
      };

      const response = await proteinApi.generate(projectId, payload, true);
      if (response.status === 'queued') {
        window.alert('Генерация запущена. Обнови список через пару секунд.');
      } else {
        window.alert('Структура сгенерирована.');
      }
      await loadData();
      setTab('structures');
    } catch (apiError) {
      setError(apiError.message || 'Ошибка генерации белка');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!uploadFile || !uploadName.trim()) {
      setError('Укажи имя структуры и выбери .pdb файл');
      return;
    }

    setUploading(true);
    setError('');
    try {
      await proteinApi.upload(projectId, uploadFile, uploadName.trim());
      setUploadName('');
      setUploadFile(null);
      const fileInput = document.getElementById('upload-input');
      if (fileInput) {
        fileInput.value = '';
      }
      await loadData();
      setTab('structures');
    } catch (apiError) {
      setError(apiError.message || 'Ошибка загрузки структуры');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStructure = async (structureId) => {
    const shouldDelete = window.confirm('Удалить структуру?');
    if (!shouldDelete) {
      return;
    }

    try {
      await proteinApi.delete(structureId);
      setStructures((prev) => prev.filter((structure) => structure.id !== structureId));
    } catch (apiError) {
      setError(apiError.message || 'Не удалось удалить структуру');
    }
  };

  if (loading) {
    return (
      <div className="screen center">
        <div className="loader" />
        <p>Загрузка проекта...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="screen center">
        <p>Проект не найден.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="screen project-screen">
      <header className="topbar">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">Проект #{project.id}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          К проектам
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Параметры проекта</h2>
        <form className="form-grid" onSubmit={handleSaveProject}>
          <label>
            Название
            <input
              type="text"
              value={projectForm.name}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
              maxLength={100}
              required
            />
          </label>
          <label>
            Описание
            <textarea
              rows={4}
              value={projectForm.description}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
              maxLength={2000}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={savingProject}>
            {savingProject ? 'Сохраняем...' : 'Сохранить проект'}
          </button>
        </form>
      </section>

      <div className="tabs-row">
        <button className={`tab-btn ${tab === 'structures' ? 'active' : ''}`} onClick={() => setTab('structures')}>
          Структуры
        </button>
        <button className={`tab-btn ${tab === 'generate' ? 'active' : ''}`} onClick={() => setTab('generate')}>
          Генерация
        </button>
        <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
          Загрузка PDB
        </button>
      </div>

      {tab === 'structures' && (
        <section className="card">
          <div className="section-header">
            <h2>Структуры белков</h2>
            <button className="btn btn-secondary" onClick={loadData}>
              Обновить список
            </button>
          </div>

          {structures.length === 0 ? (
            <p className="muted">В проекте пока нет структур.</p>
          ) : (
            <div className="project-grid">
              {structures.map((structure) => (
                <article key={structure.id} className="project-card">
                  <h3>{structure.name}</h3>
                  <p className="muted small">Создано: {new Date(structure.created_at).toLocaleString()}</p>
                  <p className="muted small">
                    Источник: {structure?.generation_params?.source === 'upload' ? 'Загрузка' : 'Генерация'}
                  </p>

                  <div className="metric-list">
                    <span>Realism: {structure?.metrics?.realism_score ?? '—'}</span>
                    <span>pLDDT: {structure?.metrics?.pLDDT ?? '—'}</span>
                    <span>scRMSD: {structure?.metrics?.sc_rmsd ?? '—'}</span>
                  </div>

                  <div className="actions-row">
                    <button className="btn btn-primary" onClick={() => navigate(`/proteins/${structure.id}`)}>
                      3D просмотр
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteStructure(structure.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'generate' && (
        <section className="card">
          <h2>Генерация / модификация белка</h2>
          <form className="form-grid" onSubmit={handleGenerate}>
            <label>
              Режим
              <select
                value={generationForm.mode}
                onChange={(event) => setGenerationForm((prev) => ({ ...prev, mode: event.target.value }))}
              >
                <option value="generate">Сгенерировать новый</option>
                <option value="modify">Модифицировать существующий</option>
              </select>
            </label>

            <label>
              Длина последовательности (50-500)
              <input
                type="number"
                min={50}
                max={500}
                value={generationForm.length}
                onChange={(event) => setGenerationForm((prev) => ({ ...prev, length: event.target.value }))}
                required
              />
            </label>

            <label>
              Качество (0.1-1.0)
              <input
                type="number"
                min={0.1}
                max={1}
                step={0.1}
                value={generationForm.quality}
                onChange={(event) => setGenerationForm((prev) => ({ ...prev, quality: event.target.value }))}
                required
              />
            </label>

            <label>
              Симметрия
              <select
                value={generationForm.symmetry}
                onChange={(event) => setGenerationForm((prev) => ({ ...prev, symmetry: event.target.value }))}
              >
                <option value="none">Нет</option>
                <option value="cyclic">Cyclic</option>
                <option value="dihedral">Dihedral</option>
                <option value="tetrahedral">Tetrahedral</option>
              </select>
            </label>

            <label>
              Дополнительные условия
              <textarea
                rows={4}
                placeholder="Например: устойчивость при pH 6.5, связывание лиганда..."
                value={generationForm.conditions}
                onChange={(event) => setGenerationForm((prev) => ({ ...prev, conditions: event.target.value }))}
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={generating}>
              {generating ? 'Генерируем...' : 'Запустить генерацию'}
            </button>
          </form>
        </section>
      )}

      {tab === 'upload' && (
        <section className="card">
          <h2>Загрузка готовой структуры</h2>
          <form className="form-grid" onSubmit={handleUpload}>
            <label>
              Название структуры
              <input
                type="text"
                value={uploadName}
                onChange={(event) => setUploadName(event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label>
              Файл PDB
              <input
                id="upload-input"
                type="file"
                accept=".pdb"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                required
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={uploading}>
              {uploading ? 'Загружаем...' : 'Загрузить структуру'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default ProjectPage;
