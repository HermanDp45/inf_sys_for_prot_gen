import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdArrowForward, MdBiotech, MdPersonAdd } from 'react-icons/md';

import ThemeToggle from './ThemeToggle';
import { authApi } from '../utils/api';

const Register = ({ onAuthSuccess, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const loginResult = await authApi.login(form.username.trim(), form.password);
      await onAuthSuccess(loginResult.access_token);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setError(apiError.message || 'Не удалось создать аккаунт');
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
        <h1>Создай лабораторное пространство для генерации и анализа белковых структур.</h1>
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
            <p className="eyebrow">Регистрация</p>
            <h2>Новый аккаунт</h2>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <p className="muted">После регистрации система сразу откроет личный кабинет.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Username
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </label>

          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={8}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <MdPersonAdd />
            {loading ? 'Создаем...' : 'Создать аккаунт'}
            <MdArrowForward />
          </button>
        </form>

        <p className="muted auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
