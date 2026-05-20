import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

interface CompletarModuloDTO {
  usuarioId: number;
  moduloId: number;
}

export const getCursos = () => api.get("/courses");
export const getRanking = () =>
  api.get("/gamification/ranking");

export const getInsignias = (userId: number) =>
  api.get(`/gamification/insignias/${userId}`);

export const getMisPuntos = (userId: number) =>
  api.get(`/gamification/mis-puntos/${userId}`);

export const completarModulo = (
  data: CompletarModuloDTO
) =>
  api.post("/gamification/completar-modulo", data);

export default api;