# GLaDOs

Sistema de gestión de conocimiento personal con IA. Captura texto libre (ideas, errores, aprendizajes, decisiones), genera embeddings duales y organiza el conocimiento en conceptos que evolucionan automáticamente según su recurrencia.

## Features

- **Embeddings duales** - MiniLM (384-dim) para similitud de frase + MPNet (768-dim) para similitud semántica
- **Conceptos evolutivos** - Los conceptos cambian de estado automáticamente: `cruda → recurrente → importante → dormida → resuelta`
- **Búsqueda semántica** - Encuentra conceptos relacionados usando similitud coseno con pgvector
- **Extracción automática** - Keywords y resúmenes generados con KeyBERT
- **PWA** - Interfaz web con soporte offline y autenticación JWT

## Tech Stack

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Express 4, TypeScript 5, pg 8 |
| **AI Service** | FastAPI, Sentence Transformers, KeyBERT |
| **Base de datos** | PostgreSQL 16 + pgvector (IVFFlat) |
| **Infraestructura** | Docker Compose |

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PWA       │────▶│   Express   │────▶│  PostgreSQL │
│  (Frontend) │     │  (Backend)  │     │  + pgvector │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   FastAPI   │
                   │ (Embeddings)│
                   └─────────────┘
```

**Flujo principal:**
1. Usuario envía texto via `POST /api/entries`
2. Backend solicita embeddings duales al AI service
3. Búsqueda de conceptos similares por similitud coseno (umbral 0.55)
4. Si hay match → refuerza el concepto existente
5. Si no hay match → crea concepto nuevo con summary y keywords

## Getting Started

### Requisitos

- Docker y Docker Compose
- (Opcional) Node.js 18+ para desarrollo local

### Configuración

1. Clona el repositorio:
```bash
git clone https://github.com/abraham-diaz/GLaDOs.git
cd GLaDOs
```

2. Crea el archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Configura las variables en `.env`:
```bash
# Base de datos
POSTGRES_USER=glados
POSTGRES_PASSWORD=tu-password-seguro
POSTGRES_DB=glados

# Autenticación
AUTH_USERNAME=admin
AUTH_PASSWORD=tu-password-seguro
JWT_SECRET=tu-clave-secreta-aleatoria
JWT_EXPIRES_IN=90d
```

4. Levanta los servicios:
```bash
docker-compose up --build
```

5. Accede a la aplicación en `http://localhost:3000`

### Desarrollo local

```bash
# Backend (requiere DB y AI service corriendo)
cd backend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload
```

## API Endpoints

| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/health` | GET | No | Health check (DB + AI service) |
| `/api/auth/login` | POST | No | Login, devuelve JWT |
| `/api/auth/verify` | GET | Sí | Verificar token válido |
| `/api/entries` | POST | Sí | Crear nueva entrada |
| `/api/concepts` | GET | Sí | Listar conceptos |
| `/api/concepts/search` | POST | Sí | Búsqueda semántica |

## Modelo de Datos

```sql
entries          -- Texto del usuario + embedding de frase
concepts         -- Conocimiento extraído con embeddings duales, peso y estado
entry_concept    -- Relación N:N con score de similitud
signals          -- Metadatos (emoción, repetición, intención, claridad)
weekly_summaries -- Resúmenes semanales agregados
```

### Estados de un concepto

| Estado | Descripción |
|--------|-------------|
| `cruda` | Concepto recién creado |
| `recurrente` | Peso >= 2, aparece frecuentemente |
| `importante` | Marcado manualmente como importante |
| `dormida` | Sin actividad reciente |
| `resuelta` | Concepto cerrado/completado |

### Tipos de concepto

`idea` · `error` · `aprendizaje` · `decision`

## Estructura del Proyecto

```
GLaDOs/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/         # Variables de entorno
│   │   ├── services/       # Lógica de negocio
│   │   ├── routes/         # Endpoints REST
│   │   ├── queries/        # SQL parametrizado
│   │   └── types/          # Interfaces TypeScript
│   └── public/             # PWA frontend
├── ai-service/             # Python + FastAPI
│   └── main.py             # Embeddings + KeyBERT
├── db/
│   └── init.sql            # Schema con pgvector
└── docker-compose.yml
```

## License

MIT
