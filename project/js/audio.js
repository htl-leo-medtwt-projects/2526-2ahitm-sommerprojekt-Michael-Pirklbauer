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
            width = 400,
            height = 150,
            style = "ios",
            color = "#ffffff",
            speed = 0.05,
            amplitude = 0,
            curveDefinition = [
                { attenuation: -2, lineWidth: 2, opacity: 0.1 },
                { attenuation: -6, lineWidth: 2, opacity: 0.2 },
                { attenuation: 4, lineWidth: 2, opacity: 0.4 },
                { attenuation: 2, lineWidth: 2, opacity: 0.6 },
                { attenuation: 1, lineWidth: 2.5, opacity: 1 },
            ],
            ...audioOptions
        } = options;

        if (!container) {
            throw new Error("container is required");
        }

        this.#audio = typeof audio === "string"
            ? new Audio(audio)
            : audio;

        Object.assign(this.#audio, audioOptions);

        this.#visualizer = new SiriWave({
            container,
            width,
            height,
            style,
            color,
            speed,
            autostart: true,
            amplitude,
            curveDefinition
        });

        this.#audio.addEventListener("ended", () => {
            this.stop();
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

        const average = sum / this.#dataArray.length;

        this.#visualizer.setAmplitude(
            Math.max(
                0,
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

    load() {
        this.#audio.load();
    }

    addEventListener(type, listener, options) {
        return this.#audio.addEventListener(type, listener, options);
    };

    removeEventListener(type, listener, options) {
        return this.#audio.removeEventListener(type, listener, options);
    };

    dispatchEvent(event) {
        return this.#audio.dispatchEvent(event);
    };

    get volume() {
        return this.#audio.volume;
    }

    set volume(value) {
        this.#audio.volume = value;
    }

    get muted() {
        return this.#audio.muted;
    }

    set muted(value) {
        this.#audio.muted = value;
    }

    get currentTime() {
        return this.#audio.currentTime;
    }

    set currentTime(value) {
        this.#audio.currentTime = value;
    }

    get playbackRate() {
        return this.#audio.playbackRate;
    }

    set playbackRate(value) {
        this.#audio.playbackRate = value;
    }

    get loop() {
        return this.#audio.loop;
    }

    set loop(value) {
        this.#audio.loop = value;
    }

    get src() {
        return this.#audio.src;
    }

    set src(value) {
        this.#audio.src = value;
    }

    get autoplay() {
        return this.#audio.autoplay;
    }

    set autoplay(value) {
        this.#audio.autoplay = value;
    }

    get preload() {
        return this.#audio.preload;
    }

    set preload(value) {
        this.#audio.preload = value;
    }

    get crossOrigin() {
        return this.#audio.crossOrigin;
    }

    set crossOrigin(value) {
        this.#audio.crossOrigin = value;
    }

    get duration() {
        return this.#audio.duration;
    }

    get paused() {
        return this.#audio.paused;
    }

    get ended() {
        return this.#audio.ended;
    }

    get currentSrc() {
        return this.#audio.currentSrc;
    }

    get readyState() {
        return this.#audio.readyState;
    }

    get networkState() {
        return this.#audio.networkState;
    }

    get buffered() {
        return this.#audio.buffered;
    }

    get seekable() {
        return this.#audio.seekable;
    }

    get played() {
        return this.#audio.played;
    }

    get onplay() {
        return this.#audio.onplay;
    }

    set onplay(fn) {
        this.#audio.onplay = fn;
    }

    get onpause() {
        return this.#audio.onpause;
    }

    set onpause(fn) {
        this.#audio.onpause = fn;
    }

    get onended() {
        return this.#audio.onended;
    }

    set onended(fn) {
        this.#audio.onended = fn;
    }

    get onplaying() {
        return this.#audio.onplaying;
    }

    set onplaying(fn) {
        this.#audio.onplaying = fn;
    }

    get onwaiting() {
        return this.#audio.onwaiting;
    }

    set onwaiting(fn) {
        this.#audio.onwaiting = fn;
    }

    get oncanplay() {
        return this.#audio.oncanplay;
    }

    set oncanplay(fn) {
        this.#audio.oncanplay = fn;
    }

    get oncanplaythrough() {
        return this.#audio.oncanplaythrough;
    }

    set oncanplaythrough(fn) {
        this.#audio.oncanplaythrough = fn;
    }

    get ontimeupdate() {
        return this.#audio.ontimeupdate;
    }

    set ontimeupdate(fn) {
        this.#audio.ontimeupdate = fn;
    }

    get onseeking() {
        return this.#audio.onseeking;
    }

    set onseeking(fn) {
        this.#audio.onseeking = fn;
    }

    get onseeked() {
        return this.#audio.onseeked;
    }

    set onseeked(fn) {
        this.#audio.onseeked = fn;
    }

    get onvolumechange() {
        return this.#audio.onvolumechange;
    }

    set onvolumechange(fn) {
        this.#audio.onvolumechange = fn;
    }

    get onloadstart() {
        return this.#audio.onloadstart;
    }

    set onloadstart(fn) {
        this.#audio.onloadstart = fn;
    }

    get onloadeddata() {
        return this.#audio.onloadeddata;
    }

    set onloadeddata(fn) {
        this.#audio.onloadeddata = fn;
    }

    get onloadedmetadata() {
        return this.#audio.onloadedmetadata;
    }

    set onloadedmetadata(fn) {
        this.#audio.onloadedmetadata = fn;
    }

    get onprogress() {
        return this.#audio.onprogress;
    }

    set onprogress(fn) {
        this.#audio.onprogress = fn;
    }

    get onstalled() {
        return this.#audio.onstalled;
    }

    set onstalled(fn) {
        this.#audio.onstalled = fn;
    }

    get onsuspend() {
        return this.#audio.onsuspend;
    }

    set onsuspend(fn) {
        this.#audio.onsuspend = fn;
    }

    get onerror() {
        return this.#audio.onerror;
    }

    set onerror(fn) {
        this.#audio.onerror = fn;
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