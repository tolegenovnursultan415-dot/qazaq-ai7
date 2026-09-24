```javascript
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


// ==========================================
// TYPING
// ==========================================

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

    const typing =
        document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}


// ==========================================
// AVATAR STATE
// ==========================================

function setAvatarState(state) {

    avatarPanel.classList.remove(
        "thinking",
        "speaking",
        "ready"
    );

    avatarPanel.classList.add(state);


    if (state === "thinking") {

        avatarStatus.innerHTML = `
            <span></span>
            ОЙЛАНУДА
        `;

        speakingText.textContent =
            "Жауапты дайындап жатырмын...";
    }


    if (state === "speaking") {

        avatarStatus.innerHTML = `
            <span></span>
            СӨЙЛЕП ТҰР
        `;

        speakingText.textContent =
            "Жауапты айтып жатырмын...";
    }


    if (state === "ready") {

        avatarStatus.innerHTML = `
            <span></span>
            ONLINE
        `;

        speakingText.textContent =
            "Сұрағыңызды күтіп тұрмын";
    }
}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const question = input.value.trim();

    // Бос болса жібермейміз
    if (!question) {

        input.focus();

        return;
    }


    // Батырманы уақытша өшіру
    sendButton.disabled = true;

    sendButton.style.opacity = "0.6";

    sendButton.style.cursor = "wait";


    // Сұрақты көрсету

    addMessage(
        "user",
        question
    );


    // Input тазалау

    input.value = "";


    // AI ойлануда

    setAvatarState("thinking");

    showTyping();


    try {

        console.log("QAZAQ AI сұраныс жіберілуде:", question);


        const response = await fetch(
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


        console.log(
            "Server status:",
            response.status
        );


        // JSON оқу

        const data =
            await response.json();


        console.log(
            "Server response:",
            data
        );


        removeTyping();


        // Сервер қатесі

        if (!response.ok) {

            throw new Error(
                data.answer ||
                data.error ||
                "Сервер қатесі: " +
                response.status
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


        // Сөйлеу

        setAvatarState(
            "speaking"
        );


        await speak(answer);


        // Дайын

        setAvatarState(
            "ready"
        );


    }

    catch (error) {

        console.error(
            "QAZAQ AI ERROR:",
            error
        );


        removeTyping();


        addMessage(
            "ai",
            "Кешіріңіз, қате пайда болды.\n\n" +
            error.message
        );


        setAvatarState(
            "ready"
        );

    }


    finally {

        // Батырманы қайта қосу

        sendButton.disabled = false;

        sendButton.style.opacity = "1";

        sendButton.style.cursor = "pointer";


        input.focus();

    }
}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            console.log(
                "➤ Кнопка басылды"
            );

            sendMessage();

        }
    );

}


// ==========================================
// ENTER
// ==========================================

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ==========================================
// VOICE
// ==========================================

function speak(text) {

    return new Promise(
        function(resolve) {

            if (
                !("speechSynthesis" in window)
            ) {

                console.warn(
                    "Бұл браузерде speechSynthesis жоқ."
                );

                resolve();

                return;
            }


            speechSynthesis.cancel();


            /*
             * Қазақша мәтінді табиғи оқуға
             * дайындаймыз.
             *
             * Нүкте мен үтірден кейін
             * кішкене кідіріс болады.
             */

            let speechText = text
                .replace(/\n\n+/g, ". ")
                .replace(/\n/g, ". ")
                .replace(/:/g, ": ")
                .replace(/;/g, "; ")
                .replace(/,/g, ", ")
                .replace(/\./g, ". ")
                .replace(/!/g, "! ")
                .replace(/\?/g, "? ");


            const speech =
                new SpeechSynthesisUtterance(
                    speechText
                );


            // Қазақ тілі

            speech.lang = "kk-KZ";


            /*
             * Бұрынғы 0.88 тым жылдам сезілуі мүмкін.
             */

            speech.rate = 0.72;


            /*
             * Дауысты табиғи ұстау
             */

            speech.pitch = 1.0;


            speech.volume = 1;


            speech.onstart =
                function() {

                    setAvatarState(
                        "speaking"
                    );

                };


            speech.onend =
                function() {

                    resolve();

                };


            speech.onerror =
                function(error) {

                    console.error(
                        "VOICE ERROR:",
                        error
                    );

                    resolve();

                };


            speechSynthesis.speak(
                speech
            );

        }
    );
}


// ==========================================
// NEW CHAT
// ==========================================

const newChatButton =
    document.querySelector(".new-chat");


if (newChatButton) {

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

Мен — QAZAQ AI.

Қазақ халқының дәстүрі,
мәдениеті, тарихы және
ұлттық ойындары туралы
сұрағыңызды қойыңыз.`
            );


            setAvatarState(
                "ready"
            );

        }
    );

}


// ==========================================
// DOUBLE CLICK AVATAR TEST
// ==========================================

function testTalking() {

    const testText =
        "Сәлем! Мен QAZAQ AI ассистентімін. Қазақ халқының дәстүрі мен мәдениеті туралы айтып бере аламын.";


    setAvatarState(
        "speaking"
    );


    speak(testText)
        .then(function() {

            setAvatarState(
                "ready"
            );

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


setAvatarState(
    "ready"
);
```
