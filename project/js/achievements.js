import achievementData from "../data/achievements.json" with { type: "json" };
import { SETTINGS } from "./settings.js";
import {
    censorText,
    formatDate,
    isScrollbarInsideElement,
    loadJsonFromLocalStorage,
    parseHTML,
    saveJsonToLocalStorage
} from "./utils.js";

const DEFAULT_ACHIEVEMENTS = Object.freeze({
    signalTakeover: null,
    oxygenDepletion: null,
    stationExplosion: null,
    rescue: null,
    trueEnding: null,
});

const ACHIEVEMENTS = Object.seal({
    ...DEFAULT_ACHIEVEMENTS,
    ...loadJsonFromLocalStorage("achievements")
});

const DEFAULT_ICON = Object.freeze({
    viewBox: "0 -960 960 960",
    path: `M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 
        58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 
        56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 
        560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 
        56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 
        0-85 35t-35 85v80ZM240-160v-400 400Z`.replace(/\s+/g, " "),
});

function renderAchievement(data) {
    const isUnlocked = Boolean(data.date);
    const achievementData = isUnlocked ? {
        ...data,
        status: `Obtained on: ${formatDate(data.date)}`
    } : {
        ...DEFAULT_ICON,
        title: censorText(data.title),
        description: censorText(data.description),
        status: "Locked",
    }

    return parseHTML(`
        <div class="achievement window" data-achievement="${data.id}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${achievementData.viewBox}">
                <path d="${achievementData.path}" />
            </svg>
            <div>
                <h2>${achievementData.title}</h2>
                <p>${achievementData.description}</p>
                <h3>${achievementData.status}</h3>
            </div>
        </div>
    `);
}

function unlockAchievement(id) {
    if (ACHIEVEMENTS[id]) {
        return;
    }

    ACHIEVEMENTS[id] = new Date().toISOString();

    if (SETTINGS.autosave) {
        saveJsonToLocalStorage("achievements", ACHIEVEMENTS);
    }
}

function unlockAndRenderAchievement(id) {
    unlockAchievement(id);

    const achievementElement = document.querySelector(`.achievement[data-achievement="${id}"]`);

    achievementElement.replaceWith(renderAchievement({
        ...achievementData[id],
        date: ACHIEVEMENTS[id],
        id: id,
    }));
}

function setupAchievements() {
    const container = document.querySelector("#achievements-list");
    container.innerHTML = "";

    for (const [id, data] of Object.entries(achievementData)) {
        const achievementElement = renderAchievement({
            ...data,
            date: ACHIEVEMENTS[id],
            id: id,
        });
        container.appendChild(achievementElement);
    }

    if (isScrollbarInsideElement()) {
        container.style.paddingRight = "0.75rem";
    }
}

export {
    ACHIEVEMENTS,
    unlockAchievement,
    unlockAndRenderAchievement,
    setupAchievements,
}