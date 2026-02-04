export const conceptQueries = {
  findSimilarByTopic: `
    SELECT id, title, state, summary, weight, similarity
    FROM (
      SELECT id, title, state, summary, weight,
             1 - (embedding_topic <=> $1::vector) as similarity
      FROM concepts
      WHERE embedding_topic IS NOT NULL
    ) sub
    WHERE similarity >= $2
    ORDER BY similarity DESC
    LIMIT $3
  `,

  create: `
    INSERT INTO concepts (id, title, type, state, weight, embedding, embedding_topic, summary)
    VALUES ($1, $2, 'idea', 'cruda', 1, $3, $4, $5)
  `,

  reinforce: `
    UPDATE concepts
    SET weight = weight + 1,
        last_seen_at = NOW(),
        state = CASE WHEN weight + 1 >= $2 THEN 'recurrente' ELSE state END
    WHERE id = $1
    RETURNING weight, state
  `,

  linkEntry: `
    INSERT INTO entry_concept (entry_id, concept_id, similarity)
    VALUES ($1, $2, $3)
    ON CONFLICT (entry_id, concept_id) DO NOTHING
  `,

  list: `
    SELECT
      c.id,
      c.title,
      c.type,
      c.state,
      c.weight,
      c.summary,
      c.created_at,
      c.last_seen_at,
      COUNT(ec.entry_id)::int as entry_count
    FROM concepts c
    LEFT JOIN entry_concept ec ON c.id = ec.concept_id
    GROUP BY c.id
    ORDER BY c.last_seen_at DESC
  `,

  search: `
    SELECT id, title, type, state, summary, weight, similarity
    FROM (
      SELECT id, title, type, state, summary, weight,
             1 - (embedding_topic <=> $1::vector) as similarity
      FROM concepts
      WHERE embedding_topic IS NOT NULL
    ) sub
    ORDER BY similarity DESC
    LIMIT $2
  `,
} as const;
