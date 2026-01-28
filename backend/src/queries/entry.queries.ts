export const entryQueries = {
  create: `
    INSERT INTO entries (id, raw_text, embedding)
    VALUES ($1, $2, $3)
  `,
} as const;
