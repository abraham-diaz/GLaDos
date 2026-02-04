// Constantes de lógica de negocio

export const CONCEPT = {
  /** Umbral de similitud semántica (MPNet) para asociar entries a concepts */
  TOPIC_SIMILARITY_THRESHOLD: 0.55,
  /** Weight mínimo para cambiar estado a 'recurrente' */
  MIN_WEIGHT_FOR_RECURRENT: 2,
} as const;
