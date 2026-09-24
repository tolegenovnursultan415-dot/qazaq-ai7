```javascript
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const avatarPanel = document.querySelector(".avatar-panel");
const speakingText = document.getElementById("speakingText");
const avatarStatus = document.getElementById("avatarStatus");


// ================================
// MESSAGE
// ================================

function addMessage(type, text) {

    const message = document.createElement("div");

    message.className = "message";

    if (type === "user") {
        message.classList.add("user");
    }

    const label = document.createElement("div");

    label.className = "message-label";

    label.textContent =
        type === "user"
            ? "СІЗ"
            : "QAZAQ AI";

    const bubble = document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent = text;

    message.appendChild(label);
    message.appendChild(bubble);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}


// ================================
// TYPING
// ================================

function showTyping() {

    const typing = document.createElement("div");

    typing.id = "typing";

    typing.className = "message";

    typing.innerHTML = `
        <div class="message-label">
            QAZAQ AI
        </div>

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

    if (typing) {
        typing.remove();
    }
}


// ================================
// AVATAR
// ================================

function setAvatarState(state) {

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
            "<span></span> СӨЙЛЕП ТҰР";

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


// ================================
// SEND
// ================================

async function sendMessage() {

    const question = input.value.trim();

    if (!question) {
        input.focus();
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

        const response = await fetch(
            "/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );

        const data = await response.json();

        removeTyping();

        if (!response.ok) {

            throw new Error(
                data.answer ||
                "Сервер қатесі: " + response.status
            );
        }

        const answer =
            data.answer ||
            "Жауап алынбады.";

        addMessage(
            "ai",
            answer
        );

        setAvatarState("speaking");

        await speak(answer);

        setAvatarState("ready");

    }

    catch (error) {

        console.error(
            "QAZAQ AI ERROR:",
            error
        );

        removeTyping();

        addMessage(
            "ai",
            "Кешіріңіз, қате пайда болды:\n\n" +
            error.message
        );

        setAvatarState("ready");
    }

    finally {

        sendButton.disabled = false;

        input.focus();
    }
}


// ================================
// BUTTON
// ================================

sendButton.addEventListener(
    "click",
    function(event) {

        event.preventDefault();

        sendMessage();
    }
);


// ================================
// ENTER
// ================================

input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }
    }
);


// ================================
// VOICE
// ================================

function speak(text) {

    return new Promise(function(resolve) {

        if (!("speechSynthesis" in window)) {

            resolve();

            return;
        }

        speechSynthesis.cancel();

        let speechText = text;

        speechText = speechText
            .replace(/\n\n+/g, ". ")
            .replace(/\n/g, ". ")
            .replace(/,/g, ", ")
            .replace(/\./g, ". ")
            .replace(/!/g, "! ")
            .replace(/\?/g, "? ");

        const speech =
            new SpeechSynthesisUtterance(
                speechText
            );

        speech.lang = "kk-KZ";

        speech.rate = 0.72;

        speech.pitch = 1.0;

        speech.volume = 1;

        speech.onstart = function() {

            setAvatarState("speaking");
        };

        speech.onend = function() {

            resolve();
        };

        speech.onerror = function() {

            resolve();
        };

        speechSynthesis.speak(
            speech
        );
    });
}


// ================================
// NEW CHAT
// ================================

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
                `Сәлем! 👋

Мен — QAZAQ AI.

Қазақ халқының дәстүрі,
мәдениеті, тарихы және
ұлттық ойындары туралы
сұрағыңызды қойыңыз.`
            );

            setAvatarState("ready");
        }
    );
}


// ================================
// TEST VOICE
// ================================

function testTalking() {

    const testText =
        "Сәлем! Мен QAZAQ AI ассистентімін. Қазақ халқының дәстүрі мен мәдениеті туралы айтып бере аламын.";

    setAvatarState("speaking");

    speak(testText).then(function() {

        setAvatarState("ready");
    });
}


const girl =
    document.querySelector(".ai-girl");

if (girl) {

    girl.addEventListener(
        "dblclick",
        testTalking
    );
}


// ================================
// START
// ================================

addMessage(
    "ai",
    `Сәлем! 👋

Мен — QAZAQ AI.

Қазақ халқының дәстүрі,
мәдениеті, тарихы және
ұлттық ойындары туралы
сұрағыңызды қойыңыз.`
);

setAvatarState("ready");
```
