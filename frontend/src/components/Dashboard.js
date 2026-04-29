import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { projectApi } from '../utils/api';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
    [projects]
  );

  const loadProjects = async () => {
    setLoadingProjects(true);
    setError('');
    try {
      const data = await projectApi.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (apiError) {
      setError(apiError.message || 'Не удалось загрузить проекты');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!newProject.name.trim()) {
      return;
    }

    setCreating(true);
    setError('');
    try {
      const created = await projectApi.create({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
      });
      setProjects((prev) => [created, ...prev]);
      setNewProject({ name: '', description: '' });
      setActiveTab('projects');
    } catch (apiError) {
      setError(apiError.message || 'Ошибка создания проекта');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const shouldDelete = window.confirm('Удалить проект? Будут удалены и все структуры в нем.');
    if (!shouldDelete) {
      return;
    }

    try {
      await projectApi.delete(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (apiError) {
      setError(apiError.message || 'Не удалось удалить проект');
    }
  };

  return (
    <div className="screen dashboard-screen">
      <header className="topbar">
        <div>
          <h1>Информационная система генерации белков</h1>
          <p className="muted">Добро пожаловать, {user?.username || 'пользователь'}.</p>
        </div>
        <button className="btn btn-ghost" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <div className="tabs-row">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Личный кабинет
        </button>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Проекты
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'profile' && (
        <section className="card profile-card">
          <h2>Профиль</h2>
          <div className="info-grid">
            <div>
              <span className="muted">Username</span>
              <p>{user?.username || '-'}</p>
            </div>
            <div>
              <span className="muted">Email</span>
              <p>{user?.email || '-'}</p>
            </div>
            <div>
              <span className="muted">Дата регистрации</span>
              <p>{user?.created_at ? new Date(user.created_at).toLocaleString() : '-'}</p>
            </div>
          </div>

          <hr />

          <h3>Создать новый проект</h3>
          <form className="form-grid" onSubmit={handleCreateProject}>
            <label>
              Название проекта
              <input
                type="text"
                value={newProject.name}
                onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
                maxLength={100}
                required
              />
            </label>

            <label>
              Описание
              <textarea
                value={newProject.description}
                onChange={(event) => setNewProject((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                maxLength={2000}
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Создаем...' : 'Создать проект'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'projects' && (
        <section className="card">
          <div className="section-header">
            <h2>Мои проекты</h2>
            <button className="btn btn-secondary" onClick={loadProjects}>
              Обновить
            </button>
          </div>

          {loadingProjects ? (
            <div className="center-block">
              <div className="loader" />
              <p>Загрузка проектов...</p>
            </div>
          ) : sortedProjects.length === 0 ? (
            <p className="muted">Пока нет проектов. Создай первый проект во вкладке "Личный кабинет".</p>
          ) : (
            <div className="project-grid">
              {sortedProjects.map((project) => (
                <article key={project.id} className="project-card">
                  <h3>{project.name}</h3>
                  <p className="project-description">{project.description || 'Без описания'}</p>
                  <p className="muted small">Обновлен: {new Date(project.updated_at).toLocaleString()}</p>

                  <div className="actions-row">
                    <button className="btn btn-primary" onClick={() => navigate(`/projects/${project.id}`)}>
                      Открыть
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteProject(project.id)}>
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
