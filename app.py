import os
import time
import truststore

truststore.inject_into_ssl()

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY табылмады.")

client = genai.Client(api_key=api_key)

app = Flask(__name__)

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

@app.route("/ai-girl-open.png")
def ai_girl_open():
    if os.path.exists("ai-girl-open.png"):
        return send_from_directory(".", "ai-girl-open.png", mimetype="image/png")
    return send_from_directory(".", "ai-girl.png", mimetype="image/png")

INSTRUCTIONS = """
Сенің атың — QAZAQ AI.
Сен қазақ халқының мәдениеті, тарихы, салт-дәстүрі және ұлттық құндылықтары туралы интеллектуалды ассистентсің.

МАҢЫЗДЫ ЕРЕЖЕ: Пайдаланушы сұрағына тек қазақ тілінде, МҮМКІНДІГІНШЕ ҚЫСҚА, НАҚТЫ ӘРІ ТҮСІНІКТІ (максимум 2-3 сөйлеммен) жауап бер.
"""

def generate_ai_answer(question):
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=question,
                config=types.GenerateContentConfig(
                    system_instruction=INSTRUCTIONS,
                    temperature=0.7,
                    max_output_tokens=400
                )
            )
            answer = response.text
            if not answer:
                return "Кешіріңіз, AI бұл сұраққа жауап дайындай алмады."
            return answer.strip()
        except Exception as error:
            error_text = str(error)
            if ("503" in error_text or "UNAVAILABLE" in error_text) and attempt < 2:
                time.sleep(1)
                continue
            print("Gemini API Error:", error_text)
            return "Қазір AI жауап бере алмады. Біраз уақыттан кейін қайта көріңіз."

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or not data.get("question", "").strip():
            return jsonify({"answer": "Сұрақ жазыңыз."}), 400

        question = data.get("question", "").strip()
        answer = generate_ai_answer(question)

        return jsonify({
            "answer": answer
        })

    except Exception as error:
        print("FLASK ERROR:", error)
        return jsonify({"answer": f"Сервер қатесі: {str(error)}"}), 500

# Vercel үшін маңызды
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
