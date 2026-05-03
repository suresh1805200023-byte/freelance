import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const normalizedApiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const axiosFetch = axios.create({
    baseURL: `${normalizedApiUrl}/`,
    withCredentials: true
});

export default axiosFetch;


