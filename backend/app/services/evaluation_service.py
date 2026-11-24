import json
from datetime import datetime
from typing import Dict, List, Any
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from sqlalchemy.orm import Session
from ..models.sentiment import ModelEvaluationRecord
from .sentiment_service import sentiment_classifier, EMOTIONS

# Realistic labelled benchmark dataset with 46 samples (18 English, 14 Tamil Unicode, 14 Tanglish)
BENCHMARK_DATASET = [
    # English
    {"text": "I am so happy and proud of the team's achievement today!", "label": "happy", "lang": "en"},
    {"text": "This was a truly delightful experience, thank you so much.", "label": "happy", "lang": "en"},
    {"text": "I feel so down and heartbroken after hearing the bad news.", "label": "sad", "lang": "en"},
    {"text": "I'm crying and mourning the loss of my dear friend.", "label": "sad", "lang": "en"},
    {"text": "This is infuriating! I hate how broken this system is.", "label": "angry", "lang": "en"},
    {"text": "I am so furious at the delayed response.", "label": "angry", "lang": "en"},
    {"text": "I am fed up with these constant errors and roadblocks.", "label": "frustrated", "lang": "en"},
    {"text": "This is completely blocked and I feel so hopeless.", "label": "frustrated", "lang": "en"},
    {"text": "The meeting is scheduled at 4 PM in room 3.", "label": "neutral", "lang": "en"},
    {"text": "I have completed the report as requested.", "label": "neutral", "lang": "en"},
    {"text": "I can't wait for the launch party tomorrow, yay!", "label": "excited", "lang": "en"},
    {"text": "I'm completely confused, what does this instruction even mean?", "label": "confused", "lang": "en"},
    {"text": "I'm having a panic attack about the upcoming audit.", "label": "anxious", "lang": "en"},
    {"text": "Sitting by the ocean listening to waves is so peaceful and calm.", "label": "calm", "lang": "en"},
    {"text": "I was really hoping for a promotion, but I got passed over.", "label": "disappointed", "lang": "en"},
    {"text": "I am determined to master this new skill and succeed.", "label": "motivated", "lang": "en"},
    {"text": "I've been working 14 hours straight and I'm exhausted.", "label": "tired", "lang": "en"},
    {"text": "The deadline pressure is overwhelming and I have too much work.", "label": "stressed", "lang": "en"},
    
    # Tamil Unicode
    {"text": "இன்று எனக்கு மிகுந்த மகிழ்ச்சி மற்றும் ஆனந்தம்!", "label": "happy", "lang": "ta"},
    {"text": "உங்கள் உதவிக்கு என் மனமார்ந்த நன்றி, மிக அருமை.", "label": "happy", "lang": "ta"},
    {"text": "இந்த செய்தி கேட்டு என் மனம் மிகுந்த சோகம் அடைந்தது.", "label": "sad", "lang": "ta"},
    {"text": "அவனுடைய பிரிவால் நான் மிகவும் அழுகை வருகிறேன்.", "label": "sad", "lang": "ta"},
    {"text": "எனக்கு உன் மீது மிகுந்த கோபம் மற்றும் ஆத்திரம் வருகிறது!", "label": "angry", "lang": "ta"},
    {"text": "இந்த தாமதம் என்னை மிகவும் எரிச்சல் அடைய வைக்கிறது.", "label": "angry", "lang": "ta"},
    {"text": "எனக்கு இந்த வேலை செய்வதில் மிகுந்த விரக்தி மற்றும் சலிப்பு.", "label": "frustrated", "lang": "ta"},
    {"text": "இது ஒரு சாதாரண அலுவலக தகவல்.", "label": "neutral", "lang": "ta"},
    {"text": "நாளைய விழாவுக்கு நான் மிகுந்த உற்சாகம் மற்றும் ஆவலுடன் உள்ளேன்.", "label": "excited", "lang": "ta"},
    {"text": "எனக்கு இந்த பாடம் எதுவும் புரியவில்லை, பெரிய குழப்பம்.", "label": "confused", "lang": "ta"},
    {"text": "தேர்வு முடிவை நினைத்து எனக்கு மிகுந்த பயம் மற்றும் பதற்றம்.", "label": "anxious", "lang": "ta"},
    {"text": "கோவிலில் இருக்கும்போது என் மனம் அமைதி மற்றும் நிம்மதி பெற்றது.", "label": "calm", "lang": "ta"},
    {"text": "நான் எதிர்பார்த்த முடிவு கிடைக்காமல் ஏமாற்றம் அடைந்தேன்.", "label": "disappointed", "lang": "ta"},
    {"text": "நீண்ட பயணத்திற்குப் பிறகு மிகுந்த சோர்வு மற்றும் களைப்பு.", "label": "tired", "lang": "ta"},

    # Tanglish (Romanized Tamil)
    {"text": "Innaiku project submit pannitom, semma santhosham!", "label": "happy", "lang": "tanglish"},
    {"text": "Unga help ku romba nandri, super mass!", "label": "happy", "lang": "tanglish"},
    {"text": "Manasu romba kashtama irukku, sogam thaangala.", "label": "sad", "lang": "tanglish"},
    {"text": "Avana nenachu azhugai varuthu, romba varutham.", "label": "sad", "lang": "tanglish"},
    {"text": "Yen ipdi panreenga, enakku semma kovam varuthu!", "label": "angry", "lang": "tanglish"},
    {"text": "Orey thollai, ennala mudiyala, kaduppa irukku.", "label": "frustrated", "lang": "tanglish"},
    {"text": "Naan solradha kekkama poiteenga, romba veruthu pochu.", "label": "frustrated", "lang": "tanglish"},
    {"text": "Sari pa, naan adha aprom pathukuren.", "label": "neutral", "lang": "tanglish"},
    {"text": "Naalaiku match ku semma excited, verithanam!", "label": "excited", "lang": "tanglish"},
    {"text": "Enna pannanum nu theriyala, full kuzhappam.", "label": "confused", "lang": "tanglish"},
    {"text": "Interview ku bayama irukku, romba tension.", "label": "anxious", "lang": "tanglish"},
    {"text": "Tea kudichitu nimmathiya ukkandhuruken, full chill.", "label": "calm", "lang": "tanglish"},
    {"text": "Avlo try panniyum result waste pochu, periya emattram.", "label": "disappointed", "lang": "tanglish"},
    {"text": "Thookam sokkudhu, full tired ah irukku.", "label": "tired", "lang": "tanglish"}
]

class EvaluationService:
    @staticmethod
    def run_benchmark(db: Session, model_version: str = "vcamp-multilingual-v2.0") -> ModelEvaluationRecord:
        """
        Runs empirical benchmark evaluation across all 46 multilingual test samples.
        Computes accurate Precision, Recall, Macro F1, Weighted F1, and Confusion Matrix.
        """
        y_true = []
        y_pred = []
        lang_stats = {"en": {"total": 0, "correct": 0}, "ta": {"total": 0, "correct": 0}, "tanglish": {"total": 0, "correct": 0}}

        for item in BENCHMARK_DATASET:
            target = item["label"]
            lang = item["lang"]
            res = sentiment_classifier.classify(item["text"])
            pred = res["primary_emotion"]

            y_true.append(target)
            y_pred.append(pred)

            lang_stats[lang]["total"] += 1
            if pred == target:
                lang_stats[lang]["correct"] += 1

        # Calculate exact metrics using scikit-learn
        labels = sorted(list(set(y_true + y_pred)))
        accuracy = float(accuracy_score(y_true, y_pred))
        precision_m, recall_m, f1_m, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
        precision_w, recall_w, f1_w, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)

        # Per-class metrics
        p_class, r_class, f1_class, support = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
        per_class_metrics = {}
        for idx, lbl in enumerate(labels):
            per_class_metrics[lbl] = {
                "precision": round(float(p_class[idx]), 4),
                "recall": round(float(r_class[idx]), 4),
                "f1": round(float(f1_class[idx]), 4),
                "support": int(support[idx])
            }

        # Confusion Matrix
        cm = confusion_matrix(y_true, y_pred, labels=labels)
        cm_dict = {
            "labels": labels,
            "matrix": cm.tolist()
        }

        # Language breakdown accuracy
        language_breakdown = {}
        for l_code, stats in lang_stats.items():
            acc = round(stats["correct"] / stats["total"], 4) if stats["total"] > 0 else 0.0
            language_breakdown[l_code] = {
                "total_samples": stats["total"],
                "correct_samples": stats["correct"],
                "accuracy": acc
            }

        record = ModelEvaluationRecord(
            model_version=model_version,
            dataset_name="vcamp-multilingual-benchmark-46",
            sample_count=len(BENCHMARK_DATASET),
            accuracy=round(accuracy, 4),
            macro_f1=round(float(f1_m), 4),
            weighted_f1=round(float(f1_w), 4),
            language_breakdown=json.dumps(language_breakdown),
            per_class_metrics=json.dumps(per_class_metrics),
            confusion_matrix=json.dumps(cm_dict),
            evaluated_at=datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

evaluation_service = EvaluationService()
