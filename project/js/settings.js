import {
    loadJsonFromLocalStorage,
    saveJsonToLocalStorage,
} from './utils.js';
import RangeSlider from './range-slider.js';

const DEFAULT_SETTINGS = Object.freeze({
    musicVolume: 0.55,
    sfxVolume: 0.55,
    voiceVolume: 0.55,
    textSpeed: 1.0,
    textSize: 16.0,
    autosave: true,
});

const SETTINGS = Object.seal({
    ...DEFAULT_SETTINGS,
    ...loadJsonFromLocalStorage('settings'),
});

const VALUE_MAP = Object.freeze({
    0.5: "Slow",
    1.0: "Normal",
    2.0: "Fast",
    14.0: "Small",
    16.0: "Medium",
    18.0: "Large",
    true: "Enabled",
    false: "Disabled"
});

const VALUE_CYCLES = Object.freeze({
    textSpeed: [0.5, 1.0, 2.0],
    textSize: [14, 16, 18],
    autosave: [true, false],
});

function isRangeSlider(element) {
    return element.tagName === "RANGE-SLIDER";
}

function parseValue(key, value) {
    const defaultValue = DEFAULT_SETTINGS[key];

    if (typeof defaultValue === "number") {
        return parseFloat(value);
    }

    if (typeof defaultValue === "boolean") {
        return value === "true";
    }

    return value;
}

function getNextValue(key, currentValue) {
    const cycle = VALUE_CYCLES[key];
    if (!cycle) {
        return currentValue
    };

    const index = cycle.indexOf(currentValue);
    return cycle[(index + 1) % cycle.length];
}

function renderSettingElement(element, value) {
    if (isRangeSlider(element)) {
        element.value = value;
    } else {
        element.dataset.value = value;
        element.textContent = VALUE_MAP[value];
    }
}

function updateSetting(key, rawValue, { cycle = false } = {}) {
    let value = parseValue(key, rawValue);

    if (cycle) {
        value = getNextValue(key, value);
    }

    SETTINGS[key] = value;
    saveJsonToLocalStorage('settings', SETTINGS);

    return value;
}

function setupSettings() {
    const elements = document.querySelectorAll("[data-setting]");

    for (const element of elements) {
        const key = element.dataset.setting;
        const isSlider = isRangeSlider(element);

        renderSettingElement(element, SETTINGS[key]);

        const eventType = isSlider ? "input" : "click";

        element.addEventListener(eventType, () => {
            const rawValue = isSlider ? element.value : element.dataset.value;

            const value = updateSetting(key, rawValue, {
                cycle: !isSlider,
            });

            if (!isSlider) {
                renderSettingElement(element, value);
            }
        });
    }
}

export {
    SETTINGS,
    setupSettings,
}