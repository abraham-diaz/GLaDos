export const entryQueries = {
  create: `
    INSERT INTO entries (id, raw_text, embedding)
    VALUES ($1, $2, $3)
  `,

  getById: `
    SELECT id, raw_text, embedding FROM entries WHERE id = $1
  `,

  unlinkConcept: `
    DELETE FROM entry_concept WHERE entry_id = $1
  `,

  unlinkFromConcept: `
    DELETE FROM entry_concept WHERE entry_id = $1 AND concept_id = $2
  `,

  getLinkedConcept: `
    SELECT concept_id, similarity FROM entry_concept WHERE entry_id = $1
  `,
} as const;
