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
```

}

function removeTyping() {

```
const typing =
    document.getElementById("typing");

if (typing) {
    typing.remove();
}
```

}

// ==========================================
// AVATAR
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
        avatarStatus.innerHTML = `
            <span></span>
            ОЙЛАНУДА
        `;
    }

    if (speakingText) {
        speakingText.textContent =
            "Жауапты дайындап жатырмын...";
    }
}


if (state === "speaking") {

    if (avatarStatus) {
        avatarStatus.innerHTML = `
            <span></span>
            СӨЙЛЕП ТҰР
        `;
    }

    if (speakingText) {
        speakingText.textContent =
            "Жауапты айтып жатырмын...";
    }
}


if (state === "ready") {

    if (avatarStatus) {
        avatarStatus.innerHTML = `
            <span></span>
            ONLINE
        `;
    }

    if (speakingText) {
        speakingText.textContent =
            "Сұрағыңызды күтіп тұрмын";
    }
}
```

}

// ==========================================
// KAZAKH VOICE
// ==========================================

function getKazakhVoice() {

```
const voices =
    window.speechSynthesis.getVoices();

if (!voices || voices.length === 0) {
    return null;
}


// 1. Нақты қазақша дауыс
let voice = voices.find(function (v) {

    return v.lang &&
        v.lang.toLowerCase() === "kk-kz";

});

if (voice) {
    return voice;
}


// 2. kk тілінен басталатын дауыс
voice = voices.find(function (v) {

    return v.lang &&
        v.lang.toLowerCase().startsWith("kk");

});

if (voice) {
    return voice;
}


// 3. Қазақша деп аталатын дауыс
voice = voices.find(function (v) {

    const name =
        (v.name || "").toLowerCase();

    return (
        name.includes("kazakh") ||
        name.includes("қазақ")
    );

});

if (voice) {
    return voice;
}


return null;
```

}

// ==========================================
// TEXT CLEANING
// ==========================================

function prepareSpeechText(text) {

````
let result = text;


// Markdown белгілерін алып тастау

result = result
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .replace(/_/g, "")
    .replace(/#{1,6}\s?/g, "");


// Артық бос орындарды түзету

result = result
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();


return result;
````

}

// ==========================================
// SENTENCE SPLITTER
// ==========================================

function splitIntoSentences(text) {

```
/*
   Мәтінді сөйлемдерге бөлеміз.

   Мысалы:

   "Көкпар — қазақтың ұлттық ойыны.
   Ол ат үстінде ойналады.
   Ойынның тарихы өте көне."

   Әр сөйлем жеке оқылады.
*/

const sentences =
    text.match(
        /[^.!?…]+[.!?…]+|[^.!?…]+$/g
    );


if (!sentences) {
    return [text];
}


return sentences
    .map(function (sentence) {
        return sentence.trim();
    })
    .filter(function (sentence) {
        return sentence.length > 0;
    });
```

}

// ==========================================
// SPEAK ONE SENTENCE
// ==========================================

function speakSentence(sentence, voice) {

```
return new Promise(function (resolve) {

    const speech =
        new SpeechSynthesisUtterance(
            sentence
        );


    // Қазақ тілі

    speech.lang = "kk-KZ";


    // Баяу әрі түсінікті

    speech.rate = 0.70;


    // Табиғи дауыс

    speech.pitch = 1.0;


    speech.volume = 1.0;


    if (voice) {
        speech.voice = voice;
    }


    speech.onend = function () {

        resolve();

    };


    speech.onerror = function () {

        resolve();

    };


    window.speechSynthesis.speak(
        speech
    );

});
```

}

// ==========================================
// PAUSE
// ==========================================

function wait(ms) {

```
return new Promise(function (resolve) {

    setTimeout(
        resolve,
        ms
    );

});
```

}

// ==========================================
// SPEAK
// ==========================================

async function speak(text) {

```
if (
    !("speechSynthesis" in window)
) {

    console.log(
        "Бұл браузерде дауыс функциясы жоқ."
    );

    return;

}


// Бұрынғы сөйлеуді тоқтату

window.speechSynthesis.cancel();


// Мәтінді дайындау

const cleanText =
    prepareSpeechText(text);


if (!cleanText) {
    return;
}


// Сөйлемдерге бөлу

const sentences =
    splitIntoSentences(
        cleanText
    );


// Қазақша дауыс іздеу

const voice =
    getKazakhVoice();


console.log(
    "Қолданылатын дауыс:",
    voice
        ? voice.name
        : "Қазақша дауыс табылмады"
);


// Әр сөйлемді жеке оқу

for (
    let i = 0;
    i < sentences.length;
    i++
) {

    // Егер пайдаланушы сөйлеуді тоқтатса

    if (
        window.speechSynthesis
            .speaking === false &&
        i > 0
    ) {
        // Браузердің cancel жағдайын
        // бұзбаймыз
    }


    const sentence =
        sentences[i];


    await speakSentence(
        sentence,
        voice
    );


    // Сөйлем арасындағы пауза

    if (
        sentence.endsWith("?") ||
        sentence.endsWith("!")
    ) {

        await wait(600);

    }

    else if (
        sentence.endsWith("…")
    ) {

        await wait(800);

    }

    else {

        await wait(400);

    }

}
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


input.value = "";


// AI ойланып жатыр

setAvatarState(
    "thinking"
);


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

                body:
                    JSON.stringify({
                        question:
                            question
                    })
            }
        );


    let data;

    try {

        data =
            await response.json();

    }

    catch {

        throw new Error(
            "Серверден дұрыс жауап келмеді."
        );

    }


    removeTyping();


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.answer ||
            "Сервер қатесі."
        );

    }


    const answer =
        data.answer ||
        "Жауап алынбады.";


    // AI жауабы

    addMessage(
        "ai",
        answer
    );


    // Сөйлеу

    setAvatarState(
        "speaking"
    );


    await speak(
        answer
    );


    // Дайын

    setAvatarState(
        "ready"
    );

}


catch (error) {

    console.error(
        "CHAT ERROR:",
        error
    );


    removeTyping();


    addMessage(
        "ai",
        "Кешіріңіз, жауап алу кезінде қате пайда болды:\n\n" +
        error.message
    );


    setAvatarState(
        "ready"
    );

}


finally {

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
    function () {

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
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

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
document.querySelector(
".new-chat"
);

if (newChatButton) {

```
newChatButton.addEventListener(
    "click",
    function () {

        // Дауысты тоқтату

        if (
            "speechSynthesis"
            in window
        ) {

            window.speechSynthesis.cancel();

        }


        // Чатты тазалау

        messages.innerHTML = "";


        // Бастапқы хабарлама

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
        setAvatarState(
            "ready"
        );

    }
);
```

}

// ==========================================
// TEST TALKING
// ==========================================

async function testTalking() {

```
setAvatarState(
    "speaking"
);


const testText =
    "Сәлем! Мен QAZAQ AI ассистентімін. Қазақ халқының дәстүрі мен мәдениеті туралы айтып бере аламын.";


await speak(
    testText
);


setAvatarState(
    "ready"
);
```

}

// ==========================================
// DOUBLE CLICK AVATAR
// ==========================================

const girl =
document.querySelector(
".ai-girl"
);

if (girl) {

```
girl.addEventListener(
    "dblclick",
    testTalking
);
```

}

// ==========================================
// LOAD VOICES
// ==========================================

if (
"speechSynthesis"
in window
) {

```
window.speechSynthesis
    .addEventListener(
        "voiceschanged",
        function () {

            const voice =
                getKazakhVoice();

            console.log(
                "Дауыстар жүктелді."
            );

            console.log(
                "Қазақша дауыс:",
                voice
                    ? voice.name
                    : "табылмады"
            );

        }
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

setAvatarState(
"ready"
);

// ==========================================
// DEBUG
// ==========================================

console.log(
"QAZAQ AI іске қосылды."
);

console.log(
"SpeechSynthesis:",
"speechSynthesis" in window
);

console.log(
"Дауыстар:",
"speechSynthesis" in window
? speechSynthesis.getVoices().length
: 0
);
