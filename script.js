
"use strict";

// ==========================================
// QAZAQ AI — script.js
// ==========================================

// Элементтер
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");

let availableVoices = [];
let isAudioUnlocked = false;
let isSending = false;

// ==========================================
// ДАУЫСТАРДЫ ЖҮКТЕУ
// ==========================================

function loadVoices() {
    if (!("speechSynthesis" in window)) return;

    availableVoices = window.speechSynthesis.getVoices();

    console.log(
        "Қолжетімді дауыстар:",
        availableVoices.map(v => `${v.name} (${v.lang})`)
    );
}

if ("speechSynthesis" in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Мобильді браузерде дыбыстауды іске қосуға әрекет жасау
function unlockAudio() {
    if (!("speechSynthesis" in window) || isAudioUnlocked) return;

    try {
        const utterance = new SpeechSynthesisUtterance(" ");
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
        isAudioUnlocked = true;
    } catch (error) {
        console.warn("Дыбыстауды іске қосу мүмкін болмады:", error);
    }
}

// ==========================================
// ДЫБЫСТАЛАТЫН МӘТІНДІ ТАЗАЛАУ
// ==========================================

function cleanTextForSpeech(text) {
    if (!text) return "";

    let result = String(text);

    // Markdown кестелерінің бөлгіштері мен код блоктары
    result = result.replace(/```[\s\S]*?```/g, " ");
    result = result.replace(/`([^`]+)`/g, "$1");

    // Markdown сілтемелері: [атауы](сілтеме) -> атауы
    result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1");

    // URL мекенжайларын оқымау
    result = result.replace(/https?:\/\/\S+/gi, " ");

    // Markdown тақырыптары мен тізімдері
    result = result.replace(/^\s{0,3}#{1,6}\s+/gm, "");
    result = result.replace(/^\s*[-*+]\s+/gm, "");
    result = result.replace(/^\s*\d+[.)]\s+/gm, "");

    // Қалың және көлбеу мәтін белгілерін алып тастау
    result = result.replace(/\*\*(.*?)\*\*/gs, "$1");
    result = result.replace(/__(.*?)__/gs, "$1");
    result = result.replace(/\*(.*?)\*/gs, "$1");
    result = result.replace(/_(.*?)_/gs, "$1");

    // HTML тегтерін алып тастау
    result = result.replace(/<[^>]*>/g, " ");

    // Эмодзилерді алып тастау
    try {
        result = result.replace(/\p{Extended_Pictographic}/gu, " ");
    } catch (error) {
        result = result.replace(/[\u{1F300}-\u{1FAFF}]/gu, " ");
    }

    // Смайликтер мен артық тыныс белгілерін реттеу
    result = result.replace(/[⭐️✨🎉👋😊🙂👍❤️🔥]/gu, " ");

    // Тізбектелген техникалық белгілерді бос орынға ауыстыру
    result = result.replace(/[|{}[\]<>~=^]/g, " ");

    // Жол ауыстырулар мен бірнеше бос орын
    result = result.replace(/\s+/g, " ");

    // Бос орын алдындағы тыныс белгілерін реттеу
    result = result.replace(/\s+([,.;:!?])/g, "$1");

    return result.trim();
}

// ==========================================
// ХАБАРЛАМАЛАР
// ==========================================

function addMessage(type, text) {
    if (!messages) return;

    const message = document.createElement("div");
    message.className = "message";

    if (type === "user") {
        message.classList.add("user");
    }

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = type === "user" ? "СІЗ" : "QAZAQ AI";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    message.appendChild(label);
    message.appendChild(bubble);
    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
    if (!messages) return;

    const typing = document.createElement("div");
    typing.id = "typing";
    typing.className = "message";

    typing.innerHTML = `
        <div class="message-label">QAZAQ AI</div>
        <div class="bubble typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;

    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

// ==========================================
// АВАТАР КҮЙІ
// ==========================================

function setAvatarState(state) {
    if (avatarPanel) {
        avatarPanel.classList.remove("thinking", "speaking", "ready");
        avatarPanel.classList.add(state);
    }

    if (state === "thinking") {
        if (avatarStatus) {
            avatarStatus.innerHTML = "<span></span> ОЙЛАНУДА";
        }

        if (speakingText) {
            speakingText.textContent = "Жауапты дайындап жатырмын...";
        }
    } else if (state === "speaking") {
        if (avatarStatus) {
            avatarStatus.innerHTML = "<span></span> СӨЙЛЕП ТҰР";
        }

        if (speakingText) {
            speakingText.textContent = "Жауапты айтып жатырмын...";
        }
    } else {
        if (avatarStatus) {
            avatarStatus.innerHTML = "<span></span> ONLINE";
        }

        if (speakingText) {
            speakingText.textContent = "Сұрағыңызды күтіп тұрмын";
        }
    }
}

// ==========================================
// ҚАЗАҚША ДАУЫСТЫ ТАҢДАУ
// ==========================================

function chooseKazakhVoice() {
    if (!availableVoices.length && "speechSynthesis" in window) {
        availableVoices = window.speechSynthesis.getVoices();
    }

    // Тек қазақша дауысты іздейміз.
    // Қазақша дауыс табылмаса, басқа тілді үнсіз таңдамау керек.
    const kazakhVoices = availableVoices.filter(voice => {
        const lang = (voice.lang || "").toLowerCase();
        const name = (voice.name || "").toLowerCase();

        return (
            lang === "kk-kz" ||
            lang === "kk_kz" ||
            lang === "kk" ||
            lang.startsWith("kk-") ||
            lang.startsWith("kk_") ||
            name.includes("kazakh") ||
            name.includes("қазақ")
        );
    });

    return kazakhVoices.find(v => v.lang.toLowerCase() === "kk-kz")
        || kazakhVoices[0]
        || null;
}

// ==========================================
// ДЫБЫСТАУ
// ==========================================

function speakText(rawText) {
    return new Promise(resolve => {
        if (!("speechSynthesis" in window)) {
            console.warn("Бұл браузер дыбыстауды қолдамайды.");
            resolve();
            return;
        }

        const textToSpeak = cleanTextForSpeech(rawText);

        if (!textToSpeak) {
            resolve();
            return;
        }

        // Бұрынғы сөйлеуді тоқтату
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const kazakhVoice = chooseKazakhVoice();

        // Тіл параметрі қазақша болып қалады
        utterance.lang = "kk-KZ";

        // Жылдамдық пен үн биіктігі
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (kazakhVoice) {
            utterance.voice = kazakhVoice;
            utterance.lang = kazakhVoice.lang;
            console.log("Таңдалған дауыс:", kazakhVoice.name, kazakhVoice.lang);
        } else {
            console.warn(
                "Қазақша дауыс табылмады. Браузердің тіл баптауларынан қазақша дауысты тексеріңіз."
            );
        }

        let finished = false;

        function finish() {
            if (finished) return;
            finished = true;
            resolve();
        }

        utterance.onend = finish;

        utterance.onerror = event => {
            console.warn("Дыбыстау қатесі:", event.error);
            finish();
        };

        // Кейбір браузерлердегі тоқтап қалу жағдайын азайту үшін
        try {
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error("Дыбыстау іске қосылмады:", error);
            finish();
        }
    });
}

// ==========================================
// СҰРАҚ ЖІБЕРУ
// ==========================================

async function sendMessage() {
    if (!input || isSending) return;

    const question = input.value.trim();
    if (!question) return;

    unlockAudio();

    isSending = true;
    if (sendButton) sendButton.disabled = true;

    addMessage("user", question);
    input.value = "";

    setAvatarState("thinking");
    showTyping();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        removeTyping();

        if (!response.ok) {
            throw new Error(
                data.answer || data.error || "Серверде қате орын алды."
            );
        }

        const answer = data.answer || "Жауап алынбады.";

        addMessage("ai", answer);
        setAvatarState("speaking");

        await speakText(answer);
        setAvatarState("ready");

    } catch (error) {
        console.error("Сұрақ жіберу қатесі:", error);
        removeTyping();

        addMessage(
            "ai",
            "Кешіріңіз, қате пайда болды: " + error.message
        );

        setAvatarState("ready");

    } finally {
        isSending = false;
        if (sendButton) sendButton.disabled = false;
    }
}

// ==========================================
// ОҚИҒАЛАР
// ==========================================

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
    sendButton.addEventListener("touchstart", unlockAudio, { passive: true });
}

if (input) {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
}

// Жаңа чат
const newChatButton = document.getElementById("newChatButton");

if (newChatButton) {
    newChatButton.addEventListener("click", () => {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        unlockAudio();

        if (messages) messages.innerHTML = "";

        addMessage(
            "ai",
            "Сәлем! Мен — QAZAQ AI. Қазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз."
        );

        setAvatarState("ready");
    });
}

// Алғашқы сәлемдесу
addMessage(
    "ai",
    "Сәлем! Мен — QAZAQ AI. Қазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз."
);

setAvatarState("ready");

// Дауыстар кейде кеш жүктелетін браузерлер үшін
if ("speechSynthesis" in window) {
    window.addEventListener("load", () => {
        setTimeout(loadVoices, 300);
    });
}
