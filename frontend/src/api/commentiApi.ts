import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

export async function getUltimiCommenti(limit = 10) {
  const userStore = useUserStore();
  const token = userStore.token;
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/api/proposte/commenti?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.data.commenti;
}
