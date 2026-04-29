import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdBiotech, MdDelete, MdFolderOpen, MdLogout, MdPerson, MdRefresh, MdScience } from 'react-icons/md';

import ThemeToggle from './ThemeToggle';
import { projectApi } from '../utils/api';

const Dashboard = ({ user, onLogout, theme, onToggleTheme }) => {
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
  const updatedTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return projects.filter((project) => new Date(project.updated_at).toDateString() === today).length;
  }, [projects]);

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
      <header className="app-header animate-in">
        <div className="brand-line">
          <div className="brand-mark small">
            <MdBiotech />
          </div>
          <div>
            <p className="eyebrow">Protein Design IS</p>
            <h1>Рабочая панель</h1>
          </div>
        </div>
        <div className="top-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="btn btn-ghost" onClick={onLogout}>
            <MdLogout />
            Выйти
          </button>
        </div>
      </header>

      <section className="hero-panel animate-in delay-1">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h2>Добро пожаловать, {user?.username || 'пользователь'}</h2>
          <p className="muted">Создавай проекты, генерируй структуры и открывай их в Mol* viewer без лишних переходов.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('profile')}>
          <MdAdd />
          Новый проект
        </button>
      </section>

      <section className="stat-strip animate-in delay-2">
        <div className="stat-tile">
          <span>Проекты</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="stat-tile">
          <span>Обновлено сегодня</span>
          <strong>{updatedTodayCount}</strong>
        </div>
        <div className="stat-tile">
          <span>Аккаунт</span>
          <strong>{user?.username || '-'}</strong>
        </div>
      </section>

      <div className="tabs-row animate-in delay-3">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <MdPerson />
          Личный кабинет
        </button>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <MdScience />
          Проекты
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'profile' && (
        <div className="dashboard-grid animate-in">
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
          </section>

          <section className="card create-card">
            <div>
              <p className="eyebrow">Новый проект</p>
              <h2>Описание эксперимента</h2>
            </div>
            <form className="form-grid" onSubmit={handleCreateProject}>
              <label>
                Название проекта
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
                  maxLength={100}
                  placeholder="Например: de novo binder design"
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
                  placeholder="Цель, условия генерации, заметки по структурам..."
                />
              </label>

              <button className="btn btn-primary" type="submit" disabled={creating}>
                <MdAdd />
                {creating ? 'Создаем...' : 'Создать проект'}
              </button>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'projects' && (
        <section className="card animate-in">
          <div className="section-header">
            <h2>Мои проекты</h2>
            <button className="btn btn-secondary" onClick={loadProjects}>
              <MdRefresh />
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
                      <MdFolderOpen />
                      Открыть
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDeleteProject(project.id)} title="Удалить проект">
                      <MdDelete />
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
