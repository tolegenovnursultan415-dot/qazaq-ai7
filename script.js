// Элементтерді алу
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");

// Дауыстар тізімін кэштеу
let availableVoices = [];

function loadVoices() {
    if ('speechSynthesis' in window) {
        availableVoices = window.speechSynthesis.getVoices();
    }
}

// Браузерде дауыстар дайын болғанда жүктеу
if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Мәтінді дауыстауға дайындау (Markdown, Emoji және артық белгілерді тазалау)
function cleanTextForSpeech(text) {
    if (!text) return "";
    return text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Emoji тазалау
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold ** **
        .replace(/\*(.*?)\*/g, '$1')     // Italic * *
        .replace(/`{1,3}.*?`{1,3}/g, '') // Code blocks
        .replace(/[#*_\-\\/~]/g, '')     // Артық арнайы белгілер
        .replace(/\s+/g, ' ')           // Артық пробелдер
        .trim();
}

// Мессадж қосу функциясы
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

// AI жауап дайындап жатқандағы индикатор
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

// Аватар күйін ауыстыру
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

// Браузерлік дауыстау (Web Speech API) - Дұрысталған нұсқасы
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

        // Бұрынғы сөйлеп жатқан дауысты тоқтату
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'kk-KZ';
        utterance.rate = 0.95; // Сәл баяу, табиғирақ шығу үшін
        utterance.pitch = 1.0;

        // Қолжетімді дауыстарды қайта жаңарту
        if (availableVoices.length === 0) {
            availableVoices = window.speechSynthesis.getVoices();
        }

        // 1. Алдымен жүйедегі "kk" немесе "Kazakh" дауысын іздеу
        let kazakhVoice = availableVoices.find(v => 
            v.lang.includes('kk') || v.lang.includes('KK') || v.name.toLowerCase().includes('kazakh')
        );

        // 2. Егер қазақша дауыс жоқ болса, Google-дың немесе стандартты Түркі/Орыс/Мұхит тілдерінің анық дауысын баптау
        if (!kazakhVoice) {
            kazakhVoice = availableVoices.find(v => v.lang.includes('ru') || v.lang.includes('tr'));
        }

        if (kazakhVoice) {
            utterance.voice = kazakhVoice;
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

// Сұрақты серверге жіберу
async function sendMessage() {
    if (!input) return;
    const question = input.value.trim();
    if (!question) return;

    // Сұрақты экранға шығару және енгізу өрісін тазалау
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

        // Жауапты дауыстап оқу
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

// Оқиғаларды тіркеу (Event Listeners)
if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

if (input) {
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}

// Жаңа чат бастау батырмасы
const newChatButton = document.getElementById("newChatButton");
if (newChatButton) {
    newChatButton.addEventListener("click", function () {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (messages) messages.innerHTML = "";
        addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
        setAvatarState("ready");
    });
}

// Бет жүктелгендегі алғашқы сәлемдесу
addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
setAvatarState("ready");
