import re
import math
from datetime import datetime
from typing import Dict, Tuple, List, Optional
from ..config import settings

# 15 Calibrated Emotion Classes
EMOTIONS = [
    "happy", "sad", "angry", "frustrated", "neutral", 
    "excited", "confused", "anxious", "calm", "disappointed", 
    "motivated", "tired", "stressed", "curious", "mixed"
]

# Polarity Mapping
POLARITY_MAP = {
    "happy": "positive", "excited": "positive", "motivated": "positive", "calm": "positive",
    "sad": "negative", "angry": "negative", "frustrated": "negative", "anxious": "negative",
    "disappointed": "negative", "tired": "negative", "stressed": "negative",
    "neutral": "neutral", "confused": "neutral", "curious": "neutral", "mixed": "neutral"
}

# Multilingual Lexicons with weights
LEXICONS = {
    # 1. HAPPY
    "happy": {
        "en": ["happy", "glad", "joy", "cheerful", "delighted", "great", "wonderful", "fantastic", "awesome", "loving", "smile"],
        "ta": ["மகிழ்ச்சி", "சந்தோஷம்", "இன்பம்", "மகிழ்கிறேன்", "ஆனந்தம்", "நன்றி", "சிறப்பு", "அருமை"],
        "tanglish": ["santhosham", "happy", "magizhchi", "nalla irukku", "super", "semma", "romba nalla", "sandhosham", "mass"]
    },
    # 2. SAD
    "sad": {
        "en": ["sad", "unhappy", "sorrow", "grief", "crying", "depressed", "heartbroken", "down", "gloomy", "mourn"],
        "ta": ["சோகம்", "வருத்தம்", "கவலை", "அழுகை", "வேதனை", "துன்பம்", "மனவருத்தம்"],
        "tanglish": ["sogam", "varutham", "azhugai", "kavalai", "sad", "kashtam", "vedhanai", "manasu serilla"]
    },
    # 3. ANGRY
    "angry": {
        "en": ["angry", "rage", "furious", "mad", "pissed", "hate", "irritated", "wrath"],
        "ta": ["கோபம்", "ஆத்திரம்", "வெறுப்பு", "எரிச்சல்", "ஆங்காரம்"],
        "tanglish": ["kobam", "kovam", "erichal", "aathiram", "verupu", "angry", "kadupu", "sanda"]
    },
    # 4. FRUSTRATED
    "frustrated": {
        "en": ["frustrated", "annoyed", "fed up", "stuck", "irritating", "hopeless", "blocked"],
        "ta": ["விரக்தி", "சலிப்பு", "தொல்லை", "முடியவில்லை", "கடுப்பு"],
        "tanglish": ["frustrate", "veruthu", "salippu", "kadupaguthu", "thollai", "mudiyala", "kaduppa irukku"]
    },
    # 5. NEUTRAL
    "neutral": {
        "en": ["ok", "okay", "fine", "normal", "average", "sure", "alright", "neutral", "yes", "no", "information"],
        "ta": ["சரி", "நல்லது", "பரவாயில்லை", "இயல்பு", "ஆம்", "இல்லை"],
        "tanglish": ["sari", "paravala", "ok", "okay", "alright", "normal", "aama", "illa"]
    },
    # 6. EXCITED
    "excited": {
        "en": ["excited", "thrilled", "can't wait", "eager", "hyped", "overjoyed", "ecstatic", "yay", "hooray"],
        "ta": ["பரவசம்", "ஆவல்", "ஆவலுடன்", "உற்சாகம்", "மகிழ்வு"],
        "tanglish": ["excited", "aaval", "semma mass", "verithanam", "therikka", "kondattam", "pinnitom"]
    },
    # 7. CONFUSED
    "confused": {
        "en": ["confused", "puzzled", "lost", "unclear", "doubt", "perplexed", "what", "how", "baffled"],
        "ta": ["குழப்பம்", "தெரியவில்லை", "புரியவில்லை", "சந்தேகம்"],
        "tanglish": ["kuzhappam", "puriyala", "theriyala", "doubt", "enna pannanum", "purila"]
    },
    # 8. ANXIOUS / WORRIED
    "anxious": {
        "en": ["anxious", "worried", "nervous", "fear", "scared", "panicked", "dread", "uneasy", "apprehensive"],
        "ta": ["பயம்", "பதற்றம்", "கவலை", "அச்சம்", "திகில்"],
        "tanglish": ["bayam", "pathattam", "nervous", "bayama irukku", "tension", "worried", "pedhi"]
    },
    # 9. CALM
    "calm": {
        "en": ["calm", "peaceful", "relaxed", "serene", "tranquil", "quiet", "composed", "rested"],
        "ta": ["அமைதி", "நிம்மதி", "சாந்தம்", "அமைதியான"],
        "tanglish": ["amaidhi", "nimmathi", "peace", "calm", "relaxed", "chill", "nimmathiya irukku"]
    },
    # 10. DISAPPOINTED
    "disappointed": {
        "en": ["disappointed", "let down", "dismayed", "regret", "failed", "unmet", "ruined"],
        "ta": ["ஏமாற்றம்", "தோல்வி", "வருத்தம்", "ஏமாந்துவிட்டேன்"],
        "tanglish": ["emattram", "eamathitom", "let down", "disappointed", "pochu", "vela mudiyala", "waste"]
    },
    # 11. MOTIVATED
    "motivated": {
        "en": ["motivated", "inspired", "driven", "determined", "ambitious", "ready", "achieve", "focus"],
        "ta": ["ஊக்கம்", "துணிவு", "முயற்சி", "உத்வேகம்", "வெற்றி"],
        "tanglish": ["motivation", "thunivu", "vetri", "try pannuven", "ready", "jeipom", "focus"]
    },
    # 12. TIRED
    "tired": {
        "en": ["tired", "exhausted", "sleepy", "drained", "weary", "fatigued", "burnt out", "need sleep"],
        "ta": ["களைப்பு", "சோர்வு", "தூக்கம்", "அயர்வு", "ஓய்வு"],
        "tanglish": ["tired", "sorvu", "kalaippu", "thookam varuthu", "exhausted", "mudila pa", "rest venum"]
    },
    # 13. STRESSED
    "stressed": {
        "en": ["stressed", "overwhelmed", "pressure", "burdened", "hectic", "too much work", "deadline"],
        "ta": ["மன அழுத்தம்", "அழுத்தம்", "பளு", "சுமை"],
        "tanglish": ["stress", "tension", "pressure", "romba pressure", "workload", "mana azhutham"]
    },
    # 14. CURIOUS
    "curious": {
        "en": ["curious", "interested", "wonder", "inquire", "explore", "tell me more", "fascinating"],
        "ta": ["ஆர்வம்", "தெரிந்துகொள்ள", "ஆர்வமாக"],
        "tanglish": ["aarvam", "curious", "therinjukanum", "solunga", "interesting"]
    },
    # 15. MIXED / AMBIGUOUS
    "mixed": {
        "en": ["bittersweet", "mixed feelings", "not sure", "both", "partly", "conflicted"],
        "ta": ["இரண்டும்", "கலவையான", "நிச்சயமில்லை"],
        "tanglish": ["mixed", "rendum", "puriyala ana santhosham", "kavalaiyum santhoshamum"]
    }
}

# Negation terms that reverse polarity
NEGATIONS = {
    "en": ["not", "never", "no", "hardly", "barely", "scarcely", "without", "don't", "didn't", "won't", "cannot", "can't"],
    "ta": ["இல்லை", "இல்ல", "மாட்டேன்", "முடியாது", "அல்ல", "கிடையாது"],
    "tanglish": ["illa", "illai", "kidayathu", "mudiyathu", "matten", "not", "no"]
}

# Context Categories for Adaptive Companion & Pattern Question Engine
WORKLOAD_KEYWORDS = [
    "deadline", "deadlines", "overtime", "workload", "too much work", "backlog",
    "overwhelmed", "hectic", "buried", "pressure", "deliverable", "crunch",
    "பளு", "சுமை", "வேலை அதிகம்", "pressure", "vela adhigam"
]


class AdvancedSentimentClassifier:
    def __init__(self):
        self.model_version = settings.SENTIMENT_MODEL_VERSION
        self.threshold = settings.SENTIMENT_CONFIDENCE_THRESHOLD

    def detect_context_category(self, text: str, primary_emotion: str) -> str:
        lower = (text or "").lower()
        if any(k in lower for k in WORKLOAD_KEYWORDS):
            return "workload"
        if primary_emotion in ["stressed", "tired"]:
            return "stress"
        if primary_emotion in ["frustrated", "angry", "disappointed"]:
            return "frustration"
        if primary_emotion == "anxious":
            return "anxiety"
        if primary_emotion == "sad":
            return "sadness"
        if primary_emotion == "confused":
            return "confusion"
        if primary_emotion in ["motivated"]:
            return "motivation"
        if primary_emotion in ["happy", "excited", "calm"]:
            return "positive"
        return "general"

    def detect_language(self, text: str) -> str:
        """Accurately detects whether text is Tamil Unicode, Tanglish (Latin phonetics), or English."""
        # Check for Tamil Unicode range (U+0B80 to U+0BFF)
        tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', text))
        if tamil_chars > 0 and tamil_chars >= len(re.findall(r'[a-zA-Z]', text)) * 0.4:
            return "ta"
        
        # Check for Tanglish markers
        lower = text.lower()
        tanglish_hits = 0
        tanglish_markers = [
            "irukku", "iruken", "irukinga", "romba", "semma", "nalla", "enna", "epdi", "apdi", 
            "varuthu", "varala", "pannu", "pannunga", "mudiyala", "sari", "illa", "theriyala", 
            "solunga", "machan", "thala", "kavala", "santhosham", "kadupu", "pa"
        ]
        words = lower.split()
        for w in words:
            clean_w = re.sub(r'[^a-zA-Z]', '', w)
            if clean_w in tanglish_markers:
                tanglish_hits += 1
                
        if tanglish_hits >= 1 or (tanglish_hits > 0 and len(words) <= 4):
            return "tanglish"
            
        return "en"

    def preprocess_text(self, text: str, lang: str) -> List[str]:
        """Dedicated cleaning, normalizing repeated characters and colloquial contractions."""
        lower = text.lower().strip()
        # Normalize repeated characters e.g., "sooooo" -> "soo", "rombaaa" -> "rombaa"
        normalized = re.sub(r'(.)\1{2,}', r'\1\1', lower)
        # Tokenize preserving Tamil unicode or alphanumeric
        tokens = re.findall(r'[\u0B80-\u0BFF\w]+', normalized)
        return tokens

    def classify(self, text: str, context_emotion: Optional[str] = None) -> Dict:
        """
        Classifies input text into 15 emotions with calibrated probabilities,
        negation reversal, uncertainty thresholding, and optional conversational context inertia.
        """
        if not text or not text.strip():
            return self._fallback_result(text, "en")

        lang = self.detect_language(text)
        tokens = self.preprocess_text(text, lang)
        
        # Initialize raw scores
        raw_scores = {emotion: 0.05 for emotion in EMOTIONS}
        raw_scores["neutral"] = 0.15  # Baseline prior

        # Check for negation in previous 2 tokens
        negations = NEGATIONS.get(lang, []) + NEGATIONS["en"]
        
        has_negation = False
        negation_window = 0

        for idx, token in enumerate(tokens):
            if token in negations:
                has_negation = True
                negation_window = 3
                continue

            for emotion, lex_data in LEXICONS.items():
                lang_words = lex_data.get(lang, [])
                # Also fallback to tanglish/en cross-match for code-switching
                cross_words = lex_data.get("tanglish", []) + lex_data.get("en", [])

                if token in lang_words:
                    weight = 1.4
                elif token in cross_words:
                    weight = 0.9
                else:
                    weight = 0.0

                if weight > 0:
                    if negation_window > 0:
                        # Negation inverts positive <-> negative
                        if POLARITY_MAP[emotion] == "positive":
                            raw_scores["disappointed"] += weight * 0.8
                            raw_scores["sad"] += weight * 0.6
                            raw_scores[emotion] = max(0.01, raw_scores[emotion] - weight * 0.5)
                        elif POLARITY_MAP[emotion] == "negative":
                            raw_scores["calm"] += weight * 0.7
                            raw_scores["neutral"] += weight * 0.8
                            raw_scores[emotion] = max(0.01, raw_scores[emotion] - weight * 0.5)
                        else:
                            raw_scores[emotion] += weight * 0.4
                    else:
                        raw_scores[emotion] += weight

            if negation_window > 0:
                negation_window -= 1

        # Apply emotional inertia if recent context exists (smoothes abrupt jumps)
        if context_emotion and context_emotion in raw_scores:
            raw_scores[context_emotion] += 0.25

        # Softmax normalization to get calibrated probability distribution
        exp_scores = {k: math.exp(v) for k, v in raw_scores.items()}
        total_exp = sum(exp_scores.values())
        per_class_scores = {k: round(v / total_exp, 4) for k, v in exp_scores.items()}

        # Sort descending by score
        sorted_emotions = sorted(per_class_scores.items(), key=lambda item: item[1], reverse=True)
        primary_emotion, primary_conf = sorted_emotions[0]
        secondary_emotion, secondary_conf = sorted_emotions[1]

        # Determine uncertainty
        is_uncertain = primary_conf < self.threshold

        # Secondary emotion is included if it is sufficiently close to primary
        has_secondary = (secondary_conf >= 0.18 and (primary_conf - secondary_conf) < 0.22)
        final_secondary = secondary_emotion if has_secondary else None

        # Determine polarity & context category
        polarity = POLARITY_MAP.get(primary_emotion, "neutral")
        context_category = self.detect_context_category(text, primary_emotion)

        return {
            "primary_emotion": primary_emotion,
            "secondary_emotion": final_secondary,
            "confidence": primary_conf,
            "per_class_scores": per_class_scores,
            "detected_language": lang,
            "polarity": polarity,
            "context_category": context_category,
            "model_version": self.model_version,
            "prediction_timestamp": datetime.utcnow(),
            "is_uncertain": is_uncertain
        }

    def _fallback_result(self, text: str, lang: str) -> Dict:
        uniform = {e: round(1.0 / len(EMOTIONS), 4) for e in EMOTIONS}
        return {
            "primary_emotion": "neutral",
            "secondary_emotion": None,
            "confidence": 0.45,
            "per_class_scores": uniform,
            "detected_language": lang,
            "polarity": "neutral",
            "context_category": "general",
            "model_version": self.model_version,
            "prediction_timestamp": datetime.utcnow(),
            "is_uncertain": True
        }

sentiment_classifier = AdvancedSentimentClassifier()
