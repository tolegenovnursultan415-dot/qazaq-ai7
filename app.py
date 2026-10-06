import os
import time
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = None
if api_key:
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print("Gemini Client initialization error:", e)

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
    if os.path.exists("ai-girl.png"):
        return send_from_directory(".", "ai-girl.png", mimetype="image/png")
    return jsonify({"error": "Image not found"}), 404

INSTRUCTIONS = """
Сенің атың — QAZAQ AI.
Сен қазақ халқының мәдениеті, тарихы, салт-дәстүрі және ұлттық құндылықтары туралы интеллектуалды ассистентсің.

МАҢЫЗДЫ ЕРЕЖЕ: Пайдаланушы сұрағына тек қазақ тілінде, МҮМКІНДІГІНШЕ ҚЫСҚА, НАҚТЫ ӘРІ ТҮСІНІКТІ (максимум 2-3 сөйлеммен) жауап бер.
"""

def generate_ai_answer(question):
    if not client:
        return "GEMINI_API_KEY табылмады немесе қате енгізілген."

    # Жұмыс істейтін басты модель
    model_name = "gemini-2.0-flash"
    
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=question,
                config=types.GenerateContentConfig(
                    system_instruction=INSTRUCTIONS,
                    temperature=0.7,
                    max_output_tokens=400
                )
            )
            if response and response.text:
                return response.text.strip()
            return "Кешіріңіз, AI бұл сұраққа жауап дайындай алмады."
        except Exception as error:
            error_text = str(error)
            print(f"Gemini API Error (attempt {attempt+1}):", error_text)
            if ("503" in error_text or "UNAVAILABLE" in error_text) and attempt < 2:
                time.sleep(1)
                continue
            return f"AI қатесі: {error_text}"

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
