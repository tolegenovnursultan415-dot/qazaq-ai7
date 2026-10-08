
import os
import time
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Файлдар орналасқан папка
BASE_DIR = Path(__file__).resolve().parent

# Жергілікті компьютерде .env файлын оқу
load_dotenv(BASE_DIR / ".env")

# Gemini параметрлері
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

# Flask сервері
app = Flask(__name__)

# Gemini клиенті
client = None

if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
        print("Gemini клиенті дайын.")
        print("Қолданылатын модель:", MODEL_NAME)
    except Exception as error:
        print("Gemini клиентін іске қосу қатесі:", error)
else:
    print("ЕСКЕРТУ: GEMINI_API_KEY табылмады.")


INSTRUCTIONS = """
Сенің атың — QAZAQ AI.

Сен қазақ халқының мәдениеті, тарихы, салт-дәстүрі,
ұлттық ойындары, өнері және ұлттық құндылықтары туралы
білімді интеллектуалды ассистентсің.

Ережелер:
1. Пайдаланушыға қазақ тілінде жауап бер.
2. Қысқа, нақты әрі түсінікті жаз.
3. Әдетте 2–3 сөйлеммен жауап бер.
4. Қажет болғанда мысал келтір.
5. Тарихи мәліметтерді ойдан шығарма.
6. Сұрақ түсініксіз болса, нақтылауды сұра.
"""


# Сайттың басты беті
@app.route("/")
def home():
    return send_from_directory(str(BASE_DIR), "index.html")


# CSS файлы
@app.route("/style.css")
def css():
    return send_from_directory(str(BASE_DIR), "style.css")


# JavaScript файлы
@app.route("/script.js")
def javascript():
    return send_from_directory(str(BASE_DIR), "script.js")


# AI қыздың суреті
@app.route("/ai-girl.png")
def ai_girl():
    image_path = BASE_DIR / "ai-girl.png"

    if image_path.is_file():
        return send_from_directory(
            str(BASE_DIR),
            "ai-girl.png",
            mimetype="image/png"
        )

    return jsonify({"error": "ai-girl.png суреті табылмады."}), 404


def generate_ai_answer(question):
    """Gemini арқылы жауап алу және уақытша қатені қайталап көру."""

    if not API_KEY or client is None:
        return (
            "AI қызметі әлі қосылмаған. "
            "GEMINI_API_KEY параметрін тексеріңіз."
        )

    # Алғашқы әрекет және екі рет қайталап көру
    delays = [0, 1, 2]

    for attempt, delay in enumerate(delays, start=1):
        if delay:
            time.sleep(delay)

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=question,
                config=types.GenerateContentConfig(
                    system_instruction=INSTRUCTIONS,
                    temperature=0.7,
                    max_output_tokens=400
                )
            )

            if response and response.text:
                return response.text.strip()

            return (
                "Кешіріңіз, бұл сұраққа жауап дайындалмады. "
                "Сұрақты басқаша қойып көріңіз."
            )

        except Exception as error:
            error_text = str(error)
            error_lower = error_text.lower()

            print(
                f"Gemini қатесі ({attempt}/{len(delays)}): "
                f"{error_text}"
            )

            # Уақытша сервер қатесі болса, қайталап көру
            temporary_error = any(
                marker in error_lower
                for marker in [
                    "503",
                    "unavailable",
                    "high demand",
                    "overloaded",
                    "500 internal",
                    "502",
                    "504 gateway"
                ]
            )

            if temporary_error and attempt < len(delays):
                continue

            # Модель атауы дұрыс емес немесе қолжетімсіз
            if (
                "404" in error_lower
                or "not found" in error_lower
                or "is not supported" in error_lower
            ):
                return (
                    "Қолданылып жатқан Gemini моделі қолжетімсіз. "
                    "Vercel ішіндегі GEMINI_MODEL параметрін "
                    "және модельдің API арқылы қолжетімділігін тексеріңіз."
                )

            # API кілтіне қатысты мәселе
            if (
                "api_key_invalid" in error_lower
                or "api key not valid" in error_lower
                or "unauthenticated" in error_lower
                or "401" in error_lower
            ):
                return (
                    "Gemini API кілті жарамсыз немесе дұрыс "
                    "орнатылмаған. Vercel ішіндегі "
                    "GEMINI_API_KEY параметрін тексеріңіз."
                )

            # Сұраныс лимиті немесе квота
            if (
                "429" in error_lower
                or "resource_exhausted" in error_lower
                or "quota" in error_lower
            ):
                return (
                    "Gemini сұраныс лимитіне жетті. "
                    "Біраз уақыттан кейін қайталап көріңіз "
                    "немесе API квотасын тексеріңіз."
                )

            if temporary_error:
                return (
                    "Қазір AI серверіне сұраныс көп. "
                    "Бірнеше минуттан кейін қайта сұрақ қойыңыз."
                )

            return (
                "AI жауабы алынбады. Қате сервер журналында "
                "сақталды. Кейінірек қайталап көріңіз."
            )

    return (
        "Қазір AI серверіне сұраныс көп. "
        "Біраз уақыттан кейін қайта сұрақ қойыңыз."
    )


# Чат API
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        question = data.get("question", "")

        if not isinstance(question, str) or not question.strip():
            return jsonify({"answer": "Сұрақ жазыңыз."}), 400

        question = question.strip()

        if len(question) > 4000:
            return jsonify({
                "answer": "Сұрақ тым ұзын. Қысқартып қайта жіберіңіз."
            }), 400

        answer = generate_ai_answer(question)

        return jsonify({"answer": answer}), 200

    except Exception as error:
        print("FLASK ERROR:", error)

        return jsonify({
            "answer": "Серверде қате пайда болды. Кейінірек қайталап көріңіз."
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
