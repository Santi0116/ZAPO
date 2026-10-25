
import axios from 'axios';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export async function comprobarBackend() {
  const response = await api.get('/api/health');
  return response.data;
}
