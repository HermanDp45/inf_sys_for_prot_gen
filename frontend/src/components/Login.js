import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdArrowForward, MdBiotech, MdLock } from 'react-icons/md';

import ThemeToggle from './ThemeToggle';
import { authApi } from '../utils/api';

const Login = ({ onAuthSuccess, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(username.trim(), password);
      await onAuthSuccess(response.access_token);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setError(apiError.message || 'Не удалось выполнить вход');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen auth-screen">
      <div className="auth-art">
        <div className="brand-mark">
          <MdBiotech />
        </div>
        <p className="eyebrow">Protein Design System</p>
        <h1>Проекты, структуры и генерация белков в одном рабочем пространстве.</h1>
        <div className="auth-molecule" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="auth-card animate-in">
        <div className="auth-card-head">
          <div>
            <p className="eyebrow">Вход</p>
            <h2>Добро пожаловать</h2>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <p className="muted">Продолжи работу с проектами и 3D-структурами.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Введите username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <MdLock />
            {loading ? 'Входим...' : 'Войти'}
            <MdArrowForward />
          </button>
        </form>

        <p className="muted auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
