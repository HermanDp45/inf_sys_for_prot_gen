import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/token`, 
      new URLSearchParams({
        username,
        password,
        grant_type: 'password'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  }
};

export const projectApi = {
  getAll: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  create: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/projects/${id}`);
  }
};

export const proteinApi = {
  getByProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/protein-structures/`);
    return response.data;
  },
  generate: async (projectId, params) => {
    const formData = new FormData();
    formData.append('params', JSON.stringify(params));
    const response = await api.post(`/projects/${projectId}/generate-protein-async/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  upload: async (projectId, file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    const response = await api.post(`/projects/${projectId}/upload-protein/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/protein-structures/${id}`);
  },
  getById: async (id) => {
    const response = await api.get(`/protein-structures/${id}`);
    return response.data;
  }
};

export default api;