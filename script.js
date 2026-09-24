const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

function addMessage(type, text) {
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

async function sendMessage() {

    const question = input.value.trim();

    if (!question) {
        return;
    }

    addMessage("user", question);

    input.value = "";

    sendButton.disabled = true;

    try {

        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.answer || "Сервер қатесі"
            );
        }

        addMessage(
            "ai",
            data.answer || "Жауап жоқ."
        );

    } catch (error) {

        console.error(error);

        addMessage(
            "ai",
            "Қате: " + error.message
        );

    } finally {

        sendButton.disabled = false;
        input.focus();

    }
}


sendButton.addEventListener(
    "click",
    function () {
        sendMessage();
    }
);


input.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


addMessage(
    "ai",
    "Сәлем! 👋 Мен — QAZAQ AI. Сұрағыңызды жазыңыз."
);
