// Элементтерді алу
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");

// Дауыстар тізімін сақтау
let availableVoices = [];
let isAudioUnlocked = false;

// Дауыстарды жүктеу
function loadVoices() {
    if ('speechSynthesis' in window) {
        availableVoices = window.speechSynthesis.getVoices();
    }
}

if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Мобильді браузердің авто-ойнату блогын ашу
function unlockAudio() {
    if (!isAudioUnlocked && 'speechSynthesis' in window) {
        const dummyUtterance = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(dummyUtterance);
        isAudioUnlocked = true;
    }
}

// Мәтінді дауыстауға тазалау (Emoji, Markdown, артық символды құрту)
function cleanTextForSpeech(text) {
    if (!text) return "";
    return text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Emoji
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold ** **
        .replace(/\*(.*?)\*/g, '$1')     // Italic * *
        .replace(/`{1,3}.*?`{1,3}/g, '') // Code
        .replace(/[#*_\-\\/~]/g, '')     // Арнайы белгілер
        .replace(/\s+/g, ' ')           // Артық пробел
        .trim();
}

// Чатқа хабарлама қосу
function addMessage(type, text) {
    if (!messages) return;
    
    const message = document.createElement("div");
    message.className = "message";
    if (type === "user") message.classList.add("user");

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

// Жауап күту индикаторы
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

// Аватар күйін баптау
function setAvatarState(state) {
    if (!avatarPanel) return;
    avatarPanel.classList.remove("thinking", "speaking", "ready");
    avatarPanel.classList.add(state);

    if (state === "thinking") {
        if (avatarStatus) avatarStatus.innerHTML = `<span></span> ОЙЛАНУДА`;
        if (speakingText) speakingText.textContent = "Жауапты дайындап жатырмын...";
    } else if (state === "speaking") {
        if (avatarStatus) avatarStatus.innerHTML = `<span></span> SPEAKING`;
        if (speakingText) speakingText.textContent = "Жауапты айтып жатырмын...";
    } else if (state === "ready") {
        if (avatarStatus) avatarStatus.innerHTML = `<span></span> ONLINE`;
        if (speakingText) speakingText.textContent = "Сұрағыңызды күтіп тұрмын";
    }
}

// Жақсартылған Табиғи Дауыстау Функциясы
function speakText(rawText) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            console.warn("Бұл браузерде Web Speech API қолдау таппайды.");
            resolve();
            return;
        }

        const textToSpeak = cleanTextForSpeech(rawText);
        if (!textToSpeak) {
            resolve();
            return;
        }

        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Табиғи интонация мен ырғақ параметрлері
        utterance.lang = 'kk-KZ';
        utterance.rate = 0.85;  // Табиғи сөйлеу жылдамдығы
        utterance.pitch = 1.1;   // Жұмсағырақ тембр

        if (availableVoices.length === 0) {
            availableVoices = window.speechSynthesis.getVoices();
        }

        // Қазақша немесе оған ең жақын анық дауысты таңдау
        let bestVoice = availableVoices.find(v => 
            v.lang === 'kk-KZ' || v.lang === 'kk_KZ' || v.name.toLowerCase().includes('kazakh')
        );

        if (!bestVoice) {
            bestVoice = availableVoices.find(v => v.lang.startsWith('kk'));
        }

        if (!bestVoice) {
            // Google немесе Apple жүйелеріндегі жақын модульдер
            bestVoice = availableVoices.find(v => 
                v.name.includes('Google') && (v.lang.includes('ru') || v.lang.includes('tr'))
            );
        }

        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.onend = () => {
            resolve();
        };

        utterance.onerror = (e) => {
            console.error("Дауыстау қатесі:", e);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// Сұрақ жіберу
async function sendMessage() {
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;

    unlockAudio();

    addMessage("user", question);
    input.value = "";

    setAvatarState("thinking");
    showTyping();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: question })
        });

        const data = await response.json();
        removeTyping();

        if (!response.ok) {
            throw new Error(data.answer || data.error || "Серверде қате орын алды");
        }

        const answer = data.answer || "Жауап алынбады.";
        addMessage("ai", answer);

        setAvatarState("speaking");
        await speakText(answer);
        setAvatarState("ready");

    } catch (error) {
        console.error("Жіберу қатесі:", error);
        removeTyping();
        addMessage("ai", "Кешіріңіз, қате пайда болды: " + error.message);
        setAvatarState("ready");
    }
}

// Event Listeners
if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
    sendButton.addEventListener("touchstart", unlockAudio);
}

if (input) {
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}

// Жаңа чат
const newChatButton = document.getElementById("newChatButton");
if (newChatButton) {
    newChatButton.addEventListener("click", function () {
        unlockAudio();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (messages) messages.innerHTML = "";
        addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
        setAvatarState("ready");
    });
}

// Алғашқы сәлемдесу
addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
setAvatarState("ready");
