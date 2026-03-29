// Constantes de lógica de negocio

export const CONCEPT = {
  /** Umbral de similitud semántica (MPNet) para asociar entries a concepts */
  TOPIC_SIMILARITY_THRESHOLD: 0.55,
  /** Penalización de similitud cuando el tipo de la entry no coincide con el del concepto */
  TYPE_MISMATCH_PENALTY: 0.15,
  /** Weight mínimo para cambiar estado a 'recurrente' */
  MIN_WEIGHT_FOR_RECURRENT: 2,
} as const;
