import httpx
from typing import List, Dict, Optional
from ..config import settings
from ..logging_config import logger
from .sentiment_service import sentiment_classifier

PROVIDER_ENDPOINTS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "openai_compatible": f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions",
}

BASE_COMPANION_SYSTEM_PROMPT = """You are VCamp, a professional, calm, and supportive AI desktop companion for Windows.
You communicate clearly and concisely in English, Tamil (தமிழ் script), or Tanglish (Tamil in Latin script) matching the user's language.
Do not claim to diagnose medical or mental health conditions. Do not instruct or execute unrestricted OS commands.
Keep responses practical, empathetic, and concise (2-4 sentences) unless asked for detailed steps.
"""


class AIProviderService:
    """Modular AI conversation service supporting Groq, OpenAI-compatible endpoints, and local fallback."""

    def __init__(self):
        self.default_provider = settings.AI_PROVIDER
        self.default_api_key = settings.GROQ_API_KEY
        self.default_model = settings.GROQ_MODEL

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        employee_memories: List[Dict[str, str]],
        custom_system_prompt: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        context_emotion: Optional[str] = None,
    ) -> Dict:
        sentiment_result = sentiment_classifier.classify(user_message, context_emotion=context_emotion)
        primary_emotion = sentiment_result["primary_emotion"]
        detected_lang = sentiment_result["detected_language"]
        context_category = sentiment_result.get("context_category", "general")

        system_content = (custom_system_prompt or "").strip() or BASE_COMPANION_SYSTEM_PROMPT
        if employee_memories:
            memories_str = "\n".join([f"- {m['key']}: {m['value']}" for m in employee_memories[:12]])
            system_content += f"\n\nConsented User Preferences & Context:\n{memories_str}"

        system_content += (
            f"\n\nConversation tone context: {primary_emotion} ({context_category}, "
            f"confidence={sentiment_result['confidence']:.2f}). Adapt response calmly and helpfully."
        )

        messages = [{"role": "system", "content": system_content}]
        for msg in conversation_history[-8:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        active_provider = (provider or self.default_provider or "groq").lower()
        active_key = (api_key if api_key is not None else self.default_api_key).strip()
        active_model = (model or self.default_model).strip()
        endpoint = PROVIDER_ENDPOINTS.get(active_provider, PROVIDER_ENDPOINTS["groq"])

        if active_provider == "offline" or not active_key:
            bot_text = self._fallback_reply(detected_lang, primary_emotion, context_category)
            used_provider = "offline_fallback"
        else:
            headers = {
                "Authorization": f"Bearer {active_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": active_model,
                "messages": messages,
                "temperature": 0.65,
                "max_tokens": 350,
            }
            try:
                async with httpx.AsyncClient(timeout=18.0) as client:
                    res = await client.post(endpoint, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        bot_text = data["choices"][0]["message"]["content"].strip()
                        used_provider = active_provider
                    else:
                        logger.warning("AI provider %s returned HTTP %s; using fallback", active_provider, res.status_code)
                        bot_text = self._fallback_reply(detected_lang, primary_emotion, context_category)
                        used_provider = "offline_fallback"
            except Exception as exc:
                logger.warning("AI provider %s request failed (%s); using fallback", active_provider, type(exc).__name__)
                bot_text = self._fallback_reply(detected_lang, primary_emotion, context_category)
                used_provider = "offline_fallback"

        return {
            "reply": bot_text,
            "sentiment": sentiment_result,
            "detected_language": detected_lang,
            "provider_used": used_provider,
        }

    def _fallback_reply(self, lang: str, emotion: str, context_category: str) -> str:
        if lang == "ta":
            if context_category in ["workload", "stress"] or emotion in ["stressed", "tired"]:
                return "பணிச்சுமை அதிகமாக இருந்தால் சிறிது இடைவெளி எடுத்துக்கொள்ளுங்கள். முன்னுரிமை பணிகளை பிரித்து பார்க்க நான் உதவலாம்."
            if emotion in ["frustrated", "angry", "sad", "anxious"]:
                return "நான் கவனமாகக் கேட்கிறேன். எதில் உதவி தேவை என்பதைப் பகிர்ந்துகொள்ளுங்கள்."
            return "வணக்கம்! உங்கள் பணிகளில் இன்று நான் எப்படி உதவ முடியும்?"

        if lang == "tanglish":
            if context_category in ["workload", "stress"] or emotion in ["stressed", "tired"]:
                return "Work pressure adhigama irundha oru chinna break edunga. Tasks-a prioritize panna naan help pannuren."
            if emotion in ["frustrated", "angry", "sad", "anxious"]:
                return "Naan gavanama kekkuren. Enna problem nu sollunga, serndhu solve pannalam."
            return "Vanakkam! Innaiku naan ungalukku epdi help panna mudiyum?"

        if context_category == "workload" or emotion in ["stressed", "tired"]:
            return "It sounds like your workload has been heavy. Would you like to break down your top priorities together?"
        if emotion in ["frustrated", "angry"]:
            return "I'm listening carefully. Let me know which part is causing friction and how I can help unblock it."
        if emotion in ["sad", "anxious", "disappointed"]:
            return "Take your time—I'm here whenever you want to talk things through or organize next steps."
        return "Hello! How can I assist you with your work today?"


groq_service = AIProviderService()
ai_provider_service = groq_service
