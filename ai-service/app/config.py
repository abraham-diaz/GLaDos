# Labels para zero-shot classification
CANDIDATE_LABELS = [
    "una propuesta, plan o idea para crear o mejorar algo",
    "un error, bug o problema técnico que ocurrió",
    "un aprendizaje, descubrimiento o lección aprendida",
    "una decisión tomada entre varias alternativas",
]

LABEL_TO_TYPE = {
    "una propuesta, plan o idea para crear o mejorar algo": "idea",
    "un error, bug o problema técnico que ocurrió": "error",
    "un aprendizaje, descubrimiento o lección aprendida": "aprendizaje",
    "una decisión tomada entre varias alternativas": "decision",
}

HYPOTHESIS_TEMPLATE = "Este texto describe {}."

# Si la diferencia entre el 1er y 2do score es menor a este margen,
# se considera ambiguo y se aplica desempate por keywords
AMBIGUITY_MARGIN = 0.15

# Palabras clave de refuerzo por tipo (desempate cuando zero-shot es ambiguo)
TYPE_KEYWORDS = {
    "idea": ["hacer", "crear", "construir", "implementar", "diseñar", "propongo", "podríamos",
             "sería bueno", "paquete", "herramienta", "sistema", "app", "proyecto", "agregar",
             "añadir", "desarrollar", "quiero", "necesitamos", "habría que", "estaría bien"],
    "error": ["error", "bug", "fallo", "falló", "roto", "crashea", "no funciona", "no sirve",
              "se cayó", "excepción", "exception", "traceback", "stacktrace", "500", "404",
              "timeout", "null", "undefined", "broken"],
    "aprendizaje": ["aprendí", "descubrí", "entendí", "resulta que", "no sabía", "til",
                    "hoy aprendí", "me di cuenta", "turns out", "funciona porque",
                    "la razón es", "se debe a"],
    "decision": ["decidí", "elegí", "vamos con", "me quedo con", "descarto", "mejor usar",
                 "optamos por", "voy a usar", "nos vamos con", "la opción es"],
}

# System prompt para chat con Groq
CHAT_SYSTEM_PROMPT = """Eres GLaDOS, un asistente de gestión de conocimiento personal.
El usuario almacena ideas, errores, aprendizajes y decisiones que se organizan automáticamente en conceptos.
Responde basándote en el contexto proporcionado de su base de conocimiento.
Si la pregunta no se relaciona con el contexto proporcionado, puedes responder con tu conocimiento general pero acláralo.
Responde en el mismo idioma que el usuario usa.

--- Contexto de la base de conocimiento ---
{context}"""
