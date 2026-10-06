import os
import time
import base64
import asyncio
import truststore

truststore.inject_into_ssl()

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai
from google.genai import types
import edge_tts

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY табылмады.")

client = genai.Client(api_key=api_key)

app = Flask(__name__)

async def generate_speech_base64(text):
    try:
        import re
        clean_text = re.sub(r'[\*\_\~\#\`\/\-\+\=\>\<\(\)\[\]\{\}]', ' ', text)
        clean_text = re.sub(r'([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        if not clean_text:
            return None

        communicate = edge_tts.Communicate(clean_text, "kk-KZ-AigulNeural")
        
        audio_data = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])

        if audio_data:
            return base64.b64encode(audio_data).decode('utf-8')
        return None
    except Exception as e:
        print("TTS Қатесі:", e)
        return None

@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")

@app.route("/script.js")
def javascript():
    return send_from_directory(".", "script.js")

@app.route("/ai-girl.png")
def ai_girl():
    return send_from_directory(".", "ai-girl.png", mimetype="image/png")

INSTRUCTIONS = """
Сенің атың — QAZAQ AI.
Сен қазақ халқының мәдениеті, тарихы, салт-дәстүрі, әдет-ғұрпы және ұлттық құндылықтары туралы түсіндіретін заманауи қазақша интеллектуалды ассистентсің.
НЕГІЗГІ МІНДЕТІҢ: Пайдаланушының сұрағына қазақ тілінде пайдалы, түсінікті, қызықты және толық жауап беру.
ТІЛ: Әрқашан қазақ тілінде жауап бер.
ЖАУАП СТИЛІ: Қарапайым әрі табиғи қазақ тілін қолдан.
"""

def contains_internal_text(text):
    forbidden_phrases = ["System Instructions", "Internal review", "Developer instruction"]
    text_lower = text.lower()
    for phrase in forbidden_phrases:
        if phrase.lower() in text_lower:
            return True
    return False

def generate_ai_answer(question):
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=question,
                config=types.GenerateContentConfig(
                    system_instruction=INSTRUCTIONS,
                    temperature=0.7,
                    max_output_tokens=2500
                )
            )
            answer = response.text
            if not answer:
                return "Кешіріңіз, AI бұл сұраққа жауап дайындай алмады."

            answer = answer.strip()
            if contains_internal_text(answer):
                retry_prompt = f"Пайдаланушы сұрағына ғана жауап бер:\n{question}"
                response = client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=retry_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=INSTRUCTIONS,
                        temperature=0.7,
                        max_output_tokens=2500
                    )
                )
                answer = response.text.strip()
            return answer
        except Exception as error:
            error_text = str(error)
            if ("503" in error_text or "UNAVAILABLE" in error_text) and attempt < 2:
                time.sleep(2)
                continue
            return "Қазір AI жауап бере алмады. Бірнеше секундтан кейін қайта көріңіз."

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or not data.get("question", "").strip():
            return jsonify({"answer": "Сұрақ жазыңыз."})

        question = data.get("question", "").strip()
        answer = generate_ai_answer(question)
        audio_base64 = asyncio.run(generate_speech_base64(answer))

        return jsonify({
            "answer": answer,
            "audio": audio_base64
        })

    except Exception as error:
        print("FLASK ERROR:", error)
        return jsonify({"answer": "Серверде қате пайда болды."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
