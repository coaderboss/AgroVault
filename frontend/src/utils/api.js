import axios from 'axios';

// ─── CENTRALIZED AXIOS INSTANCE ───
const api = axios.create({
  baseURL: 'https://agrovault.onrender.com/api', // Ab har jagah poora URL nahi likhna padega
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR (For Private Space Security) ───
api.interceptors.request.use(
  (config) => {
    // Abhi ke liye yeh khali hai. 
    // Jab hum login system banayenge, toh yahan token nikal kar automatically attach kar denge:
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── RESPONSE INTERCEPTOR (For Error Handling) ───
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Agar token expire ho gaya, toh automatically Public Space (Login Page) par bhej dega
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;