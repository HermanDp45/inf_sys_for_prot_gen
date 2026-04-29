import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '../utils/api';

const Login = ({ onAuthSuccess }) => {
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
      <div className="auth-card">
        <h1>Protein Design IS</h1>
        <p className="muted">Вход в информационную систему генерации белков</p>

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
            {loading ? 'Входим...' : 'Войти'}
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
