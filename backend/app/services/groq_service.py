import httpx
from typing import List, Dict, Optional
from ..config import settings
from .sentiment_service import sentiment_classifier

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

BASE_COMPANION_SYSTEM_PROMPT = """You are VCamp, a personal AI desktop companion for Windows.
You are empathetic, intelligent, concise, and helpful.
You natively understand and communicate fluently in:
1. Tamil (தமிழ் script) - Reply in polite, warm, natural Tamil.
2. Tanglish (Tamil in Latin script) - Reply in friendly, casual Tanglish.
3. English - Reply in articulate, concise English.

Always match the language and tone of the user:
- If the user writes in Tamil script, reply in Tamil script.
- If the user writes in Tanglish, reply in Tanglish or clean Tamil.
- If the user writes in English, reply in English.
Keep replies compact (2-4 sentences max) suitable for a lightweight floating desktop companion speech bubble.
"""

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL

    async def generate_response(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        employee_memories: List[Dict[str, str]],
        custom_system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Generates a conversational response using Groq, with employee memory injection.
        """
        # 1. Run dedicated sentiment analysis first
        sentiment_result = sentiment_classifier.classify(user_message)
        primary_emotion = sentiment_result["primary_emotion"]
        detected_lang = sentiment_result["detected_language"]

        # 2. Build system prompt with personal memory injection
        system_content = custom_system_prompt or BASE_COMPANION_SYSTEM_PROMPT
        if employee_memories:
            memories_str = "\n".join([f"- {m['key']}: {m['value']}" for m in employee_memories])
            system_content += f"\n\nPersonal Context / Employee Memory:\n{memories_str}"

        system_content += f"\n\nDetected User Emotion: {primary_emotion} (Confidence: {sentiment_result['confidence']:.2f}). Respond with appropriate emotional awareness."

        messages = [{"role": "system", "content": system_content}]

        # Add recent conversation history (up to last 6 messages)
        for msg in conversation_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_message})

        # 3. Call Groq API via httpx only when a key is configured
        if not self.api_key or not self.api_key.strip():
            bot_text = self._fallback_reply(detected_lang, primary_emotion)
        else:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 300
            }

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(GROQ_CHAT_URL, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        bot_text = data["choices"][0]["message"]["content"].strip()
                    else:
                        bot_text = self._fallback_reply(detected_lang, primary_emotion)
            except Exception:
                bot_text = self._fallback_reply(detected_lang, primary_emotion)

        return {
            "reply": bot_text,
            "sentiment": sentiment_result,
            "detected_language": detected_lang
        }

    def _fallback_reply(self, lang: str, emotion: str) -> str:
        if lang == "ta":
            if emotion in ["sad", "frustrated", "tired", "stressed"]:
                return "நான் உங்களுடன் இருக்கிறேன். கவலைப்படாதீர்கள், எல்லாம் சரியாகிவிடும்."
            return "வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்?"
        elif lang == "tanglish":
            if emotion in ["sad", "frustrated", "tired", "stressed"]:
                return "Kavalapadathinga, naan unga kooda iruken. Relax pannunga."
            return "Vanakkam! Naan ungalukku epdi help panna mudiyum?"
        else:
            if emotion in ["sad", "frustrated", "tired", "stressed"]:
                return "I'm right here with you. Take a deep breath, and let's tackle this together."
            return "Hello! How can I assist you today?"

groq_service = GroqService()
