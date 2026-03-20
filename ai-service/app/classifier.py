from . import models
from .config import CANDIDATE_LABELS, LABEL_TO_TYPE, HYPOTHESIS_TEMPLATE, AMBIGUITY_MARGIN, TYPE_KEYWORDS


def _keyword_score(text: str) -> dict[str, int]:
    """Cuenta coincidencias de palabras clave por tipo."""
    text_lower = text.lower()
    scores: dict[str, int] = {}
    for ctype, keywords in TYPE_KEYWORDS.items():
        scores[ctype] = sum(1 for kw in keywords if kw in text_lower)
    return scores


def classify_zero_shot(text: str) -> tuple[str, float]:
    """Clasifica texto usando zero-shot classification (mDeBERTa) con desempate por keywords."""
    if models.classifier is None:
        raise RuntimeError("Classifier not loaded")

    result = models.classifier(text, CANDIDATE_LABELS, hypothesis_template=HYPOTHESIS_TEMPLATE)
    best_label = result["labels"][0]
    confidence = round(result["scores"][0], 4)
    concept_type = LABEL_TO_TYPE[best_label]

    # Margen entre 1er y 2do score para detectar ambigüedad
    margin = result["scores"][0] - result["scores"][1]

    if margin < AMBIGUITY_MARGIN:
        kw_scores = _keyword_score(text)
        max_kw_type = max(kw_scores, key=kw_scores.get)  # type: ignore

        if kw_scores[max_kw_type] > 0 and kw_scores[max_kw_type] > kw_scores.get(concept_type, 0):
            print(f"[Classify] Ambiguous (margin={margin:.3f}) for '{concept_type}', "
                  f"keyword override -> '{max_kw_type}' (kw_scores: {kw_scores})")
            concept_type = max_kw_type

    return concept_type, confidence


def classify_with_debug(text: str) -> dict:
    """Clasificación con información de debug completa."""
    if models.classifier is None:
        raise RuntimeError("Classifier not loaded")

    result = models.classifier(text, CANDIDATE_LABELS, hypothesis_template=HYPOTHESIS_TEMPLATE)

    all_scores = {
        LABEL_TO_TYPE[label]: round(score, 4)
        for label, score in zip(result["labels"], result["scores"])
    }

    raw_type = LABEL_TO_TYPE[result["labels"][0]]
    margin = round(result["scores"][0] - result["scores"][1], 4)

    kw_scores = _keyword_score(text)
    final_type, final_confidence = classify_zero_shot(text)

    return {
        "concept_type": final_type,
        "confidence": final_confidence,
        "raw_type": raw_type,
        "margin": margin,
        "all_scores": all_scores,
        "keyword_scores": kw_scores,
        "was_overridden": final_type != raw_type,
    }
