import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const normalizedApiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const axiosFetch = axios.create({
    baseURL: `${normalizedApiUrl}/`,
    withCredentials: true
});

axiosFetch.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosFetch;


