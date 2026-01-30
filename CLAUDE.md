# GLaDos - Sistema de Gestión de Conocimiento Personal

## Descripción

Sistema que captura texto libre (ideas, errores, aprendizajes, decisiones), genera embeddings duales y organiza el conocimiento en conceptos que evolucionan automáticamente según su recurrencia.

## Estructura del Proyecto

```
GLaDos/
├── docker-compose.yml            # Orquestación: postgres, backend, ai-service
├── backend/                      # Node.js + Express + TypeScript
│   └── src/
│       ├── index.ts              # Entry point Express
│       ├── constants.ts          # Umbrales y reglas de negocio
│       ├── config/index.ts       # Variables de entorno
│       ├── types/                # Tipos TypeScript (entry, concept, health)
│       ├── services/             # Lógica de negocio
│       │   ├── ai.service.ts     # Cliente HTTP al servicio de IA
│       │   ├── entry.service.ts  # Creación de entradas y orquestación
│       │   ├── concept.service.ts# Matching, creación y refuerzo de conceptos
│       │   └── postgres.service.ts # Pool de conexión PostgreSQL
│       ├── routes/               # Endpoints (health, entry, concept, analyze)
│       └── queries/              # SQL parametrizado (entry, concept)
├── ai-service/                   # Python + FastAPI
│   ├── main.py                   # Embeddings + extracción de keywords
│   └── requirements.txt
└── db/
    └── init.sql                  # Schema: tablas, enums, índices vectoriales
```

## Stack Tecnológico

- **Backend**: Express 4, TypeScript 5, pg 8 (driver PostgreSQL)
- **AI Service**: FastAPI, Sentence Transformers (MiniLM 384-dim + MPNet 768-dim), KeyBERT
- **Base de datos**: PostgreSQL 16 + pgvector (IVFFlat)
- **Infraestructura**: Docker Compose 3.9

## Arquitectura

Patrón de capas: **Routes → Services → Queries → PostgreSQL**

### Flujo principal

1. Usuario envía texto via `POST /api/entries`
2. `entry.service` crea la entrada y solicita embeddings duales al AI service
3. `concept.service` busca conceptos similares por similitud coseno (umbral 0.55)
4. Si hay match: refuerza el concepto (incrementa peso, actualiza estado si corresponde)
5. Si no hay match: crea concepto nuevo con summary y keywords vía KeyBERT
6. Retorna contexto al usuario

### Embeddings duales

- **MiniLM (384-dim)**: similitud a nivel de frase
- **MPNet (768-dim)**: similitud semántica/tópico

### Estados de un concepto

`cruda → recurrente → importante → dormida → resuelta`

- Se vuelve `recurrente` al alcanzar peso >= 2

## Endpoints

| Ruta              | Método | Descripción                    |
|-------------------|--------|--------------------------------|
| `/health`         | GET    | Health check (DB + AI service) |
| `/api/entries`    | POST   | Crear nueva entrada            |
| `/api/concepts`   | GET    | Listar conceptos               |
| `/api/analyze`    | POST   | Análisis de texto (legacy)     |

## Comandos de Desarrollo

```bash
# Levantar todos los servicios
docker-compose up --build

# Solo backend en desarrollo (requiere DB y AI service corriendo)
cd backend && npm run dev
```

## Modelo de Datos

- **entries**: texto del usuario + embedding de frase
- **concepts**: conocimiento extraído con embeddings duales, peso, estado y tipo
- **entry_concept**: relación N:N entre entries y concepts con score de similitud
- **signals**: metadatos (emoción, repetición, intención, claridad)
- **weekly_summaries**: resúmenes semanales agregados

### Enums

- `concept_type`: idea, error, aprendizaje, decision
- `concept_state`: cruda, recurrente, importante, dormida, resuelta
- `signal_type`: emotion, repetition, intention, clarity
