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
    VALUES ($1, $2, $3, 'cruda', 1, $4, $5, $6)
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
    INSERT INTO entry_concept (entry_id, concept_id, similarity, entry_type)
    VALUES ($1, $2, $3, $4)
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

  getById: `
    SELECT id, title, type, state, weight, summary, created_at, last_seen_at
    FROM concepts WHERE id = $1
  `,

  getLinkedEntries: `
    SELECT e.id, e.raw_text, e.created_at, ec.similarity, ec.entry_type
    FROM entry_concept ec
    JOIN entries e ON e.id = ec.entry_id
    WHERE ec.concept_id = $1
    ORDER BY e.created_at DESC
  `,
  getAllWithTopEntry: `
    SELECT c.id, e.raw_text
    FROM concepts c
    JOIN entry_concept ec ON c.id = ec.concept_id
    JOIN entries e ON e.id = ec.entry_id
    WHERE ec.similarity = (
      SELECT MAX(ec2.similarity) FROM entry_concept ec2 WHERE ec2.concept_id = c.id
    )
  `,

  updateType: `
    UPDATE concepts SET type = $2 WHERE id = $1
  `,
} as const;
