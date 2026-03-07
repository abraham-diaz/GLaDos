CREATE EXTENSION IF NOT EXISTS vector;

-- ENUMs para claridad
CREATE TYPE concept_type AS ENUM (
  'idea',
  'error',
  'aprendizaje',
  'decision'
);

CREATE TYPE concept_state AS ENUM (
  'cruda',
  'recurrente',
  'importante',
  'dormida',
  'resuelta'
);

CREATE TYPE signal_type AS ENUM (
  'emotion',
  'repetition',
  'intention',
  'clarity'
);

-- Tabla entries (input bruto)

CREATE TABLE entries (
  id UUID PRIMARY KEY,
  raw_text TEXT NOT NULL,
  embedding VECTOR(384), -- MiniLM
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabla concepts (memorial real de GLaDos)
CREATE TABLE concepts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  type concept_type NOT NULL,
  state concept_state NOT NULL,
  summary TEXT,
  weight FLOAT NOT NULL DEFAULT 0,
  embedding VECTOR(384),        -- MiniLM: similitud de frase
  embedding_topic VECTOR(768),  -- MPNet: similitud semántica/tema
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de entry_concepts (relación semántica)
CREATE TABLE entry_concept (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  similarity FLOAT NOT NULL,
  entry_type concept_type,
  PRIMARY KEY (entry_id, concept_id)
);

-- Tabla signals (pista de IA)
CREATE TABLE signals (
  id UUID PRIMARY KEY,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  type signal_type NOT NULL,
  value TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla weekly_summaries
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY,
  week_start DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para optimización
-- Búsqueda semántica (frase)
CREATE INDEX concepts_embedding_idx
ON concepts
USING ivfflat (embedding vector_cosine_ops);

-- Búsqueda semántica (tema)
CREATE INDEX concepts_embedding_topic_idx
ON concepts
USING ivfflat (embedding_topic vector_cosine_ops);

-- Estados activos
CREATE INDEX concepts_state_idx ON concepts(state);

-- Relación temporal
CREATE INDEX entries_created_at_idx ON entries(created_at);