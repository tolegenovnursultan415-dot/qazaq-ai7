const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");


// ==========================================
// MESSAGE
// ==========================================

function addMessage(type, text) {

    const message = document.createElement("div");

    message.className = "message";

    if (type === "user") {
        message.classList.add("user");
    }

    const label = document.createElement("div");

    label.className = "message-label";

    label.textContent =
        type === "user" ? "СІЗ" : "QAZAQ AI";

    const bubble = document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent = text;

    message.appendChild(label);
    message.appendChild(bubble);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}


// ==========================================
// TYPING
// ==========================================

function showTyping() {

    const typing = document.createElement("div");

    typing.id = "typing";

    typing.className = "message";

    typing.innerHTML =
        '<div class="message-label">QAZAQ AI</div>' +
        '<div class="bubble typing-bubble">' +
        '<span class="typing-dot"></span>' +
        '<span class="typing-dot"></span>' +
        '<span class="typing-dot"></span>' +
        '</div>';

    messages.appendChild(typing);

    messages.scrollTop = messages.scrollHeight;
}


function removeTyping() {

    const typing =
        document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}


// ==========================================
// AVATAR
// ==========================================

function setAvatarState(state) {

    if (!avatarPanel) {
        return;
    }

    avatarPanel.classList.remove(
        "thinking",
        "speaking",
        "ready"
    );

    avatarPanel.classList.add(state);

    if (state === "thinking") {

        avatarStatus.innerHTML =
            "<span></span> ОЙЛАНУДА";

        speakingText.textContent =
            "Жауапты дайындап жатырмын...";
    }

    if (state === "speaking") {

        avatarStatus.innerHTML =
            "<span></span> SPEAKING";

        speakingText.textContent =
            "Жауапты айтып жатырмын...";
    }

    if (state === "ready") {

        avatarStatus.innerHTML =
            "<span></span> ONLINE";

        speakingText.textContent =
            "Сұрағыңызды күтіп тұрмын";
    }
}


// ==========================================
// VOICE
// ==========================================

function speak(text) {

    return new Promise(function(resolve) {

        if (!("speechSynthesis" in window)) {

            resolve();

            return;
        }

        speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "kk-KZ";

        speech.rate = 0.78;

        speech.pitch = 0.95;

        speech.volume = 1;

        speech.onstart = function() {

            setAvatarState("speaking");

        };

        speech.onend = function() {

            setAvatarState("ready");

            resolve();

        };

        speech.onerror = function() {

            setAvatarState("ready");

            resolve();

        };

        speechSynthesis.speak(speech);

    });
}


// ==========================================
// SEND
// ==========================================

async function sendMessage() {

    const question =
        input.value.trim();

    if (!question) {
        return;
    }

    sendButton.disabled = true;

    addMessage(
        "user",
        question
    );

    input.value = "";

    setAvatarState("thinking");

    showTyping();

    try {

        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );

        const data =
            await response.json();

        removeTyping();

        if (!response.ok) {

            throw new Error(
                data.answer ||
                "Сервер қатесі"
            );
        }

        const answer =
            data.answer ||
            "Жауап алынбады.";

        addMessage(
            "ai",
            answer
        );

        await speak(answer);

    }

    catch (error) {

        console.error(error);

        removeTyping();

        addMessage(
            "ai",
            "Қате: " + error.message
        );

        setAvatarState("ready");

    }

    finally {

        sendButton.disabled = false;

        input.focus();

    }
}


// ==========================================
// SEND BUTTON
// ==========================================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ==========================================
// ENTER
// ==========================================

input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ==========================================
// NEW CHAT
// ==========================================

const newChatButton =
    document.querySelector(".new-chat");

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        function() {

            speechSynthesis.cancel();

            messages.innerHTML = "";

            addMessage(
                "ai",
                "Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз."
            );

            setAvatarState("ready");

            input.focus();

        }
    );

}


// ==========================================
// START
// ==========================================

addMessage(
    "ai",
    "Сәлем! 👋\n\nМен — QAZAQ AI.\n\nҚазақ халқының дәстүрі, мәдениеті, тарихы және ұлттық ойындары туралы сұрағыңызды қойыңыз."
);

setAvatarState("ready");

input.focus();
