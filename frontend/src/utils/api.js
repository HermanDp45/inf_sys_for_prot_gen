import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleApiError = (error, fallbackMessage) => {
  if (!error?.response) {
    throw new Error('Backend недоступен. Запусти API на http://127.0.0.1:8000');
  }

  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') {
    throw new Error(detail);
  }
  throw new Error(fallbackMessage);
};

export const authApi = {
  async login(username, password) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/token`,
        new URLSearchParams({
          username,
          password,
          grant_type: 'password',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error, 'Login failed');
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Registration failed');
    }
  },

  async me() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to load user profile');
    }
  },
};

export const projectApi = {
  async getAll() {
    try {
      const response = await api.get('/projects/');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to load projects');
    }
  },

  async getById(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to load project');
    }
  },

  async create(payload) {
    try {
      const response = await api.post('/projects/', payload);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to create project');
    }
  },

  async update(projectId, payload) {
    try {
      const response = await api.put(`/projects/${projectId}`, payload);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to update project');
    }
  },

  async delete(projectId) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete project');
    }
  },
};

export const proteinApi = {
  async getByProject(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/protein-structures/`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to load protein structures');
    }
  },

  async getById(structureId) {
    try {
      const response = await api.get(`/protein-structures/${structureId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to load protein structure');
    }
  },

  async generate(projectId, params, asynchronous = true) {
    const formData = new FormData();
    formData.append('params', JSON.stringify(params));

    try {
      const route = asynchronous
        ? `/projects/${projectId}/generate-protein-async/`
        : `/projects/${projectId}/generate-protein/`;
      const response = await api.post(route, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Protein generation failed');
    }
  },

  async upload(projectId, file, name) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    try {
      const response = await api.post(`/projects/${projectId}/upload-protein/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Protein upload failed');
    }
  },

  async delete(structureId) {
    try {
      const response = await api.delete(`/protein-structures/${structureId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete structure');
    }
  },
};

export default api;
