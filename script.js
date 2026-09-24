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

```
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
```

}

// ==========================================
// TYPING
// ==========================================

function showTyping() {

```
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
```

}

function removeTyping() {

```
const typing = document.getElementById("typing");

if (typing) {
    typing.remove();
}
```

}

// ==========================================
// AVATAR STATE
// ==========================================

function setAvatarState(state) {

```
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

    if (avatarStatus) {
        avatarStatus.innerHTML =
            "<span></span> ОЙЛАНУДА";
    }

    if (speakingText) {
        speakingText.textContent =
            "Жауапты дайындап жатырмын...";
    }
}


if (state === "speaking") {

    if (avatarStatus) {
        avatarStatus.innerHTML =
            "<span></span> SPEAKING";
    }

    if (speakingText) {
        speakingText.textContent =
            "Жауапты айтып жатырмын...";
    }
}


if (state === "ready") {

    if (avatarStatus) {
        avatarStatus.innerHTML =
            "<span></span> ONLINE";
    }

    if (speakingText) {
        speakingText.textContent =
            "Сұрағыңызды күтіп тұрмын";
    }
}
```

}

// ==========================================
// TEXT CLEANING FOR VOICE
// ==========================================

function prepareTextForSpeech(text) {

```
let clean = text;

// Markdown белгілерін алып тастау
clean = clean.replace(/[*#_`~]/g, "");

// Артық бос орындарды азайту
clean = clean.replace(/\s+/g, " ");

// Қысқа белгілерді ауызша оқуға ыңғайлау
clean = clean.replace(/—/g, ", ");
clean = clean.replace(/–/g, ", ");

// Қос нүктеден кейін кішігірім кідіріс
clean = clean.replace(/:/g, ": ");

// Нүктеден кейін анық кідіріс
clean = clean.replace(/\./g, ". ");

// Үтірден кейін кідіріс
clean = clean.replace(/,/g, ", ");

// Бірнеше бос орынды қайта тазалау
clean = clean.replace(/\s+/g, " ");

return clean.trim();
```

}

// ==========================================
// VOICE
// ==========================================

function speak(text) {

```
return new Promise(function(resolve) {

    if (!("speechSynthesis" in window)) {

        console.warn(
            "Бұл браузерде дыбыстау қолжетімсіз."
        );

        resolve();
        return;
    }


    speechSynthesis.cancel();


    const cleanText =
        prepareTextForSpeech(text);


    const speech =
        new SpeechSynthesisUtterance(
            cleanText
        );


    // Қазақ тілі
    speech.lang = "kk-KZ";

    // Баяуырақ оқу
    speech.rate = 0.78;

    // Дауыстың биіктігі
    speech.pitch = 0.95;

    // Дыбыс деңгейі
    speech.volume = 1;


    // Дауыс таңдау
    const voices =
        speechSynthesis.getVoices();


    let kazakhVoice =
        voices.find(function(voice) {

            return voice.lang
                .toLowerCase()
                .startsWith("kk");

        });


    if (!kazakhVoice) {

        kazakhVoice =
            voices.find(function(voice) {

                return voice.lang
                    .toLowerCase()
                    .startsWith("ru");

            });

    }


    if (kazakhVoice) {
        speech.voice = kazakhVoice;
    }


    speech.onstart = function() {

        setAvatarState("speaking");

    };


    speech.onend = function() {

        setAvatarState("ready");

        resolve();

    };


    speech.onerror = function(error) {

        console.error(
            "Speech error:",
            error
        );

        setAvatarState("ready");

        resolve();

    };


    speechSynthesis.speak(speech);

});
```

}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

```
const question =
    input.value.trim();


if (!question) {
    return;
}


// Батырманы уақытша өшіру
sendButton.disabled = true;


// Пайдаланушы сұрағы
addMessage(
    "user",
    question
);


// Input тазалау
input.value = "";


// AI ойланып жатыр
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


    let data;


    try {

        data =
            await response.json();

    } catch (jsonError) {

        throw new Error(
            "Серверден дұрыс жауап келмеді."
        );

    }


    removeTyping();


    if (!response.ok) {

        throw new Error(
            data.answer ||
            data.error ||
            "Сервер қатесі"
        );

    }


    const answer =
        data.answer ||
        "Жауап алынбады.";


    // AI жауабын көрсету
    addMessage(
        "ai",
        answer
    );


    // Жауапты дауыстап оқу
    await speak(answer);

}


catch (error) {

    console.error(
        "CHAT ERROR:",
        error
    );


    removeTyping();


    addMessage(
        "ai",
        "Кешіріңіз, жауап алу кезінде қате пайда болды.\n\n" +
        error.message
    );


    setAvatarState("ready");

}


finally {

    // Батырманы қайта қосу
    sendButton.disabled = false;

    input.focus();

}
```

}

// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

```
sendButton.addEventListener(
    "click",
    function() {

        sendMessage();

    }
);
```

}

// ==========================================
// ENTER
// ==========================================

if (input) {

```
input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);
```

}

// ==========================================
// NEW CHAT
// ==========================================

const newChatButton =
document.querySelector(".new-chat");

if (newChatButton) {

```
newChatButton.addEventListener(
    "click",
    function() {

        if (
            "speechSynthesis"
            in window
        ) {
            speechSynthesis.cancel();
        }


        messages.innerHTML = "";


        addMessage(
            "ai",
            `Сәлем! 👋
```

Мен — QAZAQ AI.

Қазақ халқының дәстүрі,
мәдениеті, тарихы және
ұлттық ойындары туралы
сұрағыңызды қойыңыз.`
);

```
        setAvatarState("ready");


        input.focus();

    }
);
```

}

// ==========================================
// DOUBLE CLICK AVATAR TEST
// ==========================================

function testTalking() {

```
const testText =
    "Сәлем! Мен QAZAQ AI ассистентімін. Қазақ халқының дәстүрі мен мәдениеті туралы айтып бере аламын.";

setAvatarState("speaking");

speak(testText);
```

}

const girl =
document.querySelector(".ai-girl");

if (girl) {

```
girl.addEventListener(
    "dblclick",
    testTalking
);
```

}

// ==========================================
// START
// ==========================================

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

// Input автоматты түрде фокус алады
if (input) {
input.focus();
}
