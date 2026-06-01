import SiriWave from "siriwave";
import { SETTINGS } from "./settings.js";

class AudioVisualizer {
    #audio;
    #audioContext = null;
    #analyser = null;
    #source = null;
    #dataArray = null;
    #visualizer = null;

    #animationFrame = null;
    #running = false;
    #initialized = false;

    constructor(audio, options = {}) {
        const {
            container,
            loop = false,
            volume = 1,
            width = 400,
            height = 150,
        } = options;

        if (!container) {
            throw new Error("container is required");
        }

        this.#audio = typeof audio === "string"
            ? new Audio(audio)
            : audio;

        Object.assign(this.#audio, {
            loop: loop,
            volume: volume,
            preload: "auto"
        });

        this.#visualizer = new SiriWave({
            container,
            width,
            height,
            style: "ios",
            color: "#ffffff",
            speed: 0.05,
            autostart: true,
            amplitude: 0,
            curveDefinition: [
                { attenuation: -2, lineWidth: 2, opacity: 0.1 },
                { attenuation: -6, lineWidth: 2, opacity: 0.2 },
                { attenuation: 4, lineWidth: 2, opacity: 0.4 },
                { attenuation: 2, lineWidth: 2, opacity: 0.6 },
                { attenuation: 1, lineWidth: 2.5, opacity: 1 },
            ],
        });

        this.#audio.addEventListener("ended", () => {
            this.stop();
        });

        this.#audio.addEventListener("pause", () => {
            if (!this.#audio.ended) {
                this.#stopAnimation();
            }
        });
    }

    async #initializeAudioGraph() {
        if (this.#initialized) {
            return;
        }

        this.#audioContext = new AudioContext();

        this.#source = this.#audioContext.createMediaElementSource(
            this.#audio
        );

        this.#analyser = this.#audioContext.createAnalyser();

        this.#analyser.fftSize = 256;

        this.#dataArray = new Uint8Array(
            this.#analyser.frequencyBinCount
        );

        this.#source.connect(this.#analyser);
        this.#analyser.connect(
            this.#audioContext.destination
        );

        this.#initialized = true;
    }

    #animate = () => {
        if (!this.#running) {
            return;
        }

        this.#analyser.getByteFrequencyData(
            this.#dataArray
        );

        let sum = 0;

        for (let i = 0; i < this.#dataArray.length; i++) {
            sum += this.#dataArray[i];
        }

        const average =
            sum / this.#dataArray.length;

        this.#visualizer.setAmplitude(
            Math.max(
                0.02,
                Math.min(1, average / 128)
            )
        );

        this.#animationFrame = requestAnimationFrame(
            this.#animate
        );
    };

    #startAnimation() {
        if (this.#running) {
            return;
        }

        this.#running = true;
        this.#animate();
    }

    #stopAnimation() {
        this.#running = false;

        if (this.#animationFrame) {
            cancelAnimationFrame(
                this.#animationFrame
            );

            this.#animationFrame = null;
        }

        this.#visualizer?.setAmplitude(0);
    }

    async play() {
        await this.#initializeAudioGraph();

        if (this.#audioContext.state === "suspended") {
            await this.#audioContext.resume();
        }

        await this.#audio.play();

        this.#startAnimation();
    }

    pause() {
        this.#audio.pause();
        this.#stopAnimation();
    }

    stop() {
        this.pause();
        this.#audio.currentTime = 0;
    }

    async destroy() {
        this.stop();

        if (this.#audioContext) {
            if (this.#audioContext.state !== "closed") {
                await this.#audioContext.close();
            }

            this.#audioContext = null;
        }

        this.#visualizer?.dispose();

        this.#source = null;
        this.#analyser = null;
        this.#dataArray = null;
        this.#initialized = false;
    }

    get audio() {
        return this.#audio;
    }

    get isPlaying() {
        return !this.#audio.paused && !this.#audio.ended;
    }
}

const BACKGROUND_AUDIO = new AudioVisualizer("../audio/mythical-axiom.m4a", {
    container: document.querySelector("#soundwave-container"),
    loop: true,
    volume: SETTINGS.musicVolume
});

function setupAudio() {
    document.querySelector(`#landing-page [data-route="/game"]`).addEventListener("click", () => {
        BACKGROUND_AUDIO.play();
    }, { once: true });

    document.querySelector(`#settings [data-setting="musicVolume"]`).addEventListener("input", (e) => {
        BACKGROUND_AUDIO.volume = e.target.value;
    });
}

export {
    BACKGROUND_AUDIO,
    AudioVisualizer,
    setupAudio,
}