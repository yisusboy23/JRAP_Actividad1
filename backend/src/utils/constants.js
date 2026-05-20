const PUNTOS = {
  COMPLETAR_MODULO: 10,
  COMPLETAR_CURSO: 50,
  PRIMER_ACCESO: 5,
  RACHA_7_DIAS: 30,
};

const UMBRAL_INSIGNIA = {
  PRIMER_MODULO: 1,
  ESTUDIANTE_ACTIVO: 5,
  EXPERTO: 20,
  MAESTRO: 50,
  PUNTAJE_BRONCE: 100,
  PUNTAJE_PLATA: 500,
  PUNTAJE_ORO: 1000,
};

const INSIGNIA = {
  PRIMER_PASO: "Primer paso",
  ESTUDIANTE_ACTIVO: "Estudiante activo",
  EXPERTO: "Experto",
  MAESTRO: "Maestro",
  BRONCE: "Bronce",
  PLATA: "Plata",
  ORO: "Oro",
};

const MOTIVO_PUNTOS = {
  MODULO: "modulo_completado",
  CURSO: "curso_completado",
  ACCESO: "primer_acceso_dia",
  RACHA: "racha_semanal",
};

module.exports = {
  PUNTOS,
  UMBRAL_INSIGNIA,
  INSIGNIA,
  MOTIVO_PUNTOS,
};