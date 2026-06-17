import axios from 'axios';

// Cria a instância padrão do Axios
export const api = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
=======
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api',
>>>>>>> 1122f1733359823ff46d03f4d1558eb6640415ce
  withCredentials: true,
});

export async function uploadPerformance(file: File) {
  const form = new FormData();
  form.append('file', file);
  
  const response = await api.post('/import', form);
  return response.data;
}