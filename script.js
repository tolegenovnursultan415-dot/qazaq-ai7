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

        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            currentAudio = null;
            resolve();
        };

        // Autoplay бұғаттауын ұстап алу
        audio.play().catch((err) => {
            console.warn("Autoplay бұғатталды немесе қолдау көрсетілмейді:", err);
            currentAudio = null;
            resolve();
        });
    });
}
