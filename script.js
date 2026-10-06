const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");
const aiGirlImg = document.querySelector(".ai-girl"); // Аватар суреті

let currentAudio = null;
let mouthInterval = null; // Ауыз мимикасының таймері

// ==========================================
// MESSAGE
// ==========================================
function addMessage(type, text) {
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

function showTyping() {
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
// AVATAR STATE & MOUTH ANIMATION
// ==========================================
function startMouthAnimation() {
    if (!aiGirlImg) return;
    let isOpen = false;
    
    // Ауызды 150ms сайын кезектестіріп ашып-жабу
    mouthInterval = setInterval(() => {
        isOpen = !isOpen;
        aiGirlImg.src = isOpen ? "/ai-girl-open.png" : "/ai-girl.png";
    }, 150);
}

function stopMouthAnimation() {
    if (mouthInterval) {
        clearInterval(mouthInterval);
        mouthInterval = null;
    }
    if (aiGirlImg) {
        aiGirlImg.src = "/ai-girl.png"; // Негізгі қалпына қайтару
    }
}

function setAvatarState(state) {
    avatarPanel.classList.remove("thinking", "speaking", "ready");
    avatarPanel.classList.add(state);

    if (state === "thinking") {
        stopMouthAnimation();
        avatarStatus.innerHTML = `<span></span> ОЙЛАНУДА`;
        speakingText.textContent = "Жауапты дайындап жатырмын...";
    }
    if (state === "speaking") {
        startMouthAnimation(); // Сөйлегенде ауызды қозғалту
        avatarStatus.innerHTML = `<span></span> SPEAKING`;
        speakingText.textContent = "Жауапты айтып жатырмын...";
    }
    if (state === "ready") {
        stopMouthAnimation(); // Сөйлеп болған соң тоқтату
        avatarStatus.innerHTML = `<span></span> ONLINE`;
        speakingText.textContent = "Сұрағыңызды күтіп тұрмын";
    }
}

// ==========================================
// AUDIO PLAYBACK
// ==========================================
function playAudioBase64(base64Audio) {
    return new Promise((resolve) => {
        if (!base64Audio) {
            resolve();
            return;
        }

        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        const audio = new Audio("data:audio/mp3;base64," + base64Audio);
        currentAudio = audio;

        audio.onended = () => {
            currentAudio = null;
            resolve();
        };

        audio.onerror = () => {
            currentAudio = null;
            resolve();
        };

        audio.play().catch(() => resolve());
    });
}

// ==========================================
// SEND MESSAGE
// ==========================================
async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

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
            throw new Error(data.error || "Сервер қатесі");
        }

        const answer = data.answer || "Жауап алынбады.";
        addMessage("ai", answer);

        setAvatarState("speaking");

        if (data.audio) {
            await playAudioBase64(data.audio);
        }

        setAvatarState("ready");

    } catch (error) {
        console.error(error);
        removeTyping();
        addMessage("ai", "Қате пайда болды: " + error.message);
        setAvatarState("ready");
    }
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

const newChatButton = document.querySelector(".new-chat");
if (newChatButton) {
    newChatButton.addEventListener("click", function () {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        messages.innerHTML = "";
        addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
        setAvatarState("ready");
    });
}

addMessage("ai", `Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз.`);
setAvatarState("ready");
