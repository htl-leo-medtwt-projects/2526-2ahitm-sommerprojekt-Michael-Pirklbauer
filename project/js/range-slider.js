// ChatGPT generated code, modified by Michael Pirklbauer
class RangeSlider extends HTMLElement {
    #shadowRoot;
    #sliderElement;
    #fillElement;
    #thumbElement;

    #min = 0;
    #max = 100;
    #step = 1;
    #value = 0;

    #isDragging = false;
    #initialized = false;

    constructor() {
        super();
        this.#shadowRoot = this.attachShadow({ mode: "closed" });

        this.#shadowRoot.innerHTML = `
            <style>
                :host {
                    --slider-height: 0.5rem;
                    --slider-color: rgba(255, 255, 255, 0.5);
                    --slider-radius: 1rem;
                    --fill-color: rgba(255, 255, 255, 1);
                    --thumb-size: 1rem;
                    --thumb-color: rgba(255, 255, 255, 1);
                    --thumb-radius: 50%;
                    display: inline-block;
                    width: 10rem;
                    height: 1rem;
                    align-content: center;
                }

                .slider {
                    width: 100%;
                    height: var(--slider-height);
                    border-radius: var(--slider-radius);
                    background-color: var(--slider-color);
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    position: relative;
                }

                .mask {
                    height: 100%;
                    width: 100%;
                    overflow: hidden;
                    border-radius: inherit;
                }

                .fill {
                    height: 100%;
                    width: 0%;
                    background-color: var(--fill-color);
                    border-radius: inherit;
                }

                .thumb {
                    width: var(--thumb-size);
                    aspect-ratio: 1 / 1;
                    background-color: var(--thumb-color);
                    border-radius: var(--thumb-radius);
                    position: absolute;
                    left: 0;
                    will-change: left;
                }

                :host(:not([thumb])) .thumb {
                    display: none;
                }
            </style>

            <div class="slider" part="slider" tabindex="0" role="slider">
                <div class="mask" part="mask">
                    <div class="fill" part="fill"></div>
                </div>
                <div class="thumb" part="thumb"></div>
            </div>
        `;

        this.#sliderElement = this.#shadowRoot.querySelector(".slider");
        this.#fillElement = this.#shadowRoot.querySelector(".fill");
        this.#thumbElement = this.#shadowRoot.querySelector(".thumb");
    }

    connectedCallback() {
        if (this.#initialized) {
            return;
        }

        this.#initialized = true;

        this.#initializeFromAttributes();
        this.#addEventListeners();
        this.#updateUI();
    }

    #initializeFromAttributes() {
        const minAttr = parseFloat(this.getAttribute("min"));
        const maxAttr = parseFloat(this.getAttribute("max"));
        const stepAttr = parseFloat(this.getAttribute("step"));
        const valueAttr = parseFloat(this.getAttribute("value"));

        if (Number.isFinite(minAttr)) {
            this.#min = minAttr;
        }

        if (Number.isFinite(maxAttr)) {
            this.#max = maxAttr;
        }

        if (Number.isFinite(stepAttr) && stepAttr > 0) {
            this.#step = stepAttr;
        }

        if (Number.isFinite(valueAttr)) {
            this.#value = valueAttr;
        } else {
            this.#value = this.#min;
        }

        this.#value = this.#clamp(this.#snap(this.#value));
    }

    #clamp(value) {
        return Math.max(this.#min, Math.min(this.#max, value));
    }

    #snap(value) {
        const stepped = Math.round((value - this.#min) / this.#step) * this.#step + this.#min;

        return Number(stepped.toFixed(5));
    }

    #valueToProgress(value) {
        const range = this.#max - this.#min;
        return range === 0 ? 0 : (value - this.#min) / range;
    }

    #progressToValue(progress) {
        return this.#min + progress * (this.#max - this.#min);
    }

    #getPointerProgress(event) {
        const rect = this.#sliderElement.getBoundingClientRect();
        const rawProgress = (event.clientX - rect.left) / rect.width;

        return Math.max(0, Math.min(1, rawProgress));
    }

    #updateUI() {
        const progress = this.#valueToProgress(this.#value);

        const sliderWidth = this.#sliderElement.clientWidth;
        const thumbWidth = this.#thumbElement.offsetWidth;

        const usableWidth = sliderWidth - thumbWidth;
        const positionX = usableWidth * progress;

        this.#thumbElement.style.left = `${positionX}px`;

        const fillPercent = ((positionX + thumbWidth / 2) / sliderWidth) * 100;

        this.#fillElement.style.width = `${fillPercent}%`;
    }


    #addEventListeners() {
        this.#sliderElement.addEventListener("pointerdown", this.#handlePointerDown.bind(this));
        this.#sliderElement.addEventListener("pointermove", this.#handlePointerMove.bind(this));
        this.#sliderElement.addEventListener("pointerup", this.#handlePointerUp.bind(this));
        this.#sliderElement.addEventListener("pointercancel", this.#handlePointerCancel.bind(this));

        new ResizeObserver(this.#handleResize.bind(this)).observe(this.#sliderElement);
    }

    #handlePointerDown(event) {
        this.#isDragging = true;

        this.#updateFromEvent(event);

        this.#sliderElement.setPointerCapture(event.pointerId);
    }

    #handlePointerMove(event) {
        if (!this.#isDragging) {
            return;
        }

        this.#updateFromEvent(event);
    }

    #handlePointerUp(event) {
        this.#stopDragging(event);
    }

    #handlePointerCancel(event) {
        this.#stopDragging(event);
    }

    #handleResize() {
        this.#updateUI();
    }

    #stopDragging(event) {
        if (!this.#isDragging) {
            return;
        }

        this.#isDragging = false;

        if (this.#sliderElement.hasPointerCapture(event.pointerId)) {
            this.#sliderElement.releasePointerCapture(event.pointerId);
        }
    }

    #updateFromEvent(event) {
        const progress = this.#getPointerProgress(event);

        let newValue = this.#progressToValue(progress);
        newValue = this.#clamp(this.#snap(newValue));

        this.#value = newValue;

        this.setAttribute("value", this.#value);
        this.#updateUI();
        this.#emit();
    }

    get value() {
        return this.#value;
    }

    set value(newValue) {
        if (!Number.isFinite(newValue)) {
            return;
        }

        this.#value = this.#clamp(this.#snap(newValue));
        this.setAttribute("value", this.#value);
        this.#updateUI();
    }

    get min() {
        return this.#min;
    }

    set min(newValue) {
        if (!Number.isFinite(newValue)) {
            return;
        }

        this.#min = newValue;
        this.setAttribute("min", this.#min);
        this.value = this.#value;
    }

    get max() {
        return this.#max;
    }

    set max(newValue) {
        if (!Number.isFinite(newValue)) {
            return;
        }

        this.#max = newValue;
        this.setAttribute("max", this.#max);
        this.value = this.#value;
    }

    get step() {
        return this.#step;
    }

    set step(newValue) {
        if (!Number.isFinite(newValue) || newValue <= 0) {
            return;
        }

        this.#step = newValue;
        this.setAttribute("step", this.#step);
        this.value = this.#value;
    }

    get thumb() {
        return this.hasAttribute("thumb");
    }

    set thumb(enabled) {
        this.toggleAttribute("thumb", Boolean(enabled));
    }

    #emit() {
        this.dispatchEvent(
            new Event("input", {
                bubbles: true,
                composed: true
            })
        );
    }
}

customElements.define("range-slider", RangeSlider);

export default RangeSlider;