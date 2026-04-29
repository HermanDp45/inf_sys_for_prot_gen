import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectPage from './components/ProjectPage';
import ProteinViewer from './components/ProteinViewer';
import ProtectedRoute from './components/ProtectedRoute';
import { authApi } from './utils/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const loadCurrentUser = async () => {
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      await loadCurrentUser();
      setAuthLoading(false);
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAuthSuccess = async (nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
    await loadCurrentUser();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="screen center">
        <div className="loader" />
        <p>Загружаем профиль...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onAuthSuccess={handleAuthSuccess} theme={theme} onToggleTheme={toggleTheme} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onAuthSuccess={handleAuthSuccess} theme={theme} onToggleTheme={toggleTheme} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProjectPage user={user} theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/proteins/:structureId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProteinViewer theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
