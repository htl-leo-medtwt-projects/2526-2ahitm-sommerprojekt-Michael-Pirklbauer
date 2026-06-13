import storyData from "../data/story.json" with { type: "json" };
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import {
    loadJsonFromLocalStorage,
    parseHTML,
    saveJsonToLocalStorage,
    getLowestEntry,
    clamp,
    stringToBinary,
} from "./utils.js";
import { SETTINGS } from "./settings.js";
import { unlockAndRenderAchievement } from "./achievements.js";

gsap.registerPlugin(SplitText);

const DEFAULT_STATS = Object.freeze({
    oxygen: 100,
    energy: 100,
    mentalHealth: 100,
    stability: 100,
});

const STATS = Object.seal({
    ...DEFAULT_STATS,
    ...loadJsonFromLocalStorage("stats")
});

const DEFAULT_PROGRESS = Object.freeze({
    currentNode: "start",
    currentLine: 0,
    seenNodes: [],
    choicesMade: [],
});

const PROGRESS = Object.seal({
    ...DEFAULT_PROGRESS,
    ...loadJsonFromLocalStorage("progress")
});

const STAT_MAP = Object.freeze({
    oxygen: "Oxygen",
    energy: "Energy",
    mentalHealth: "Mental Health",
    stability: "Stability",
});

const ENDING_MAP = Object.freeze({
    signalTakeover: "Signal Takeover",
    oxygenDepletion: "Oxygen Depletion",
    stationExplosion: "Station Explosion",
    rescue: "Rescue",
    trueEnding: "True Ending",
});

const imageCache = new Set();

let currentNode = storyData[PROGRESS.currentNode];
let currentTween = null;
let resolveAdvance = null;
let isWarningActive = false;

async function renderText(lines) {
    const textElement = document.querySelector("#text-container p");

    for (let i = PROGRESS.currentLine; i < lines.length; i++) {
        textElement.textContent = lines[i];

        PROGRESS.currentLine = i;
        if (SETTINGS.autosave) {
            saveJsonToLocalStorage("progress", PROGRESS);
        }

        await animateText(textElement);

        if (i < lines.length - 1) {
            await waitForAdvance();
        }
    }
}

async function animateText(textElement) {
    return new Promise(resolve => {
        const split = new SplitText(textElement, {
            type: "chars, words",
            autoSplit: true,
            smartWrap: true
        });

        currentTween = gsap.from(split.chars, {
            opacity: 0,
            stagger: 0.03 / SETTINGS.textSpeed,
            onComplete: () => {
                split.revert();
                currentTween = null;
                resolve();
            }
        });
    });
}

function waitForAdvance() {
    return new Promise(resolve => {
        resolveAdvance = resolve;

        if (SETTINGS.autoplay) {
            setTimeout(() => {
                if (resolveAdvance === resolve) {
                    resolveAdvance = null;
                    resolve();
                }
            }, 1500 / SETTINGS.textSpeed);
        }
    });
}

function handleAdvanceInput() {
    if (currentTween && currentTween.isActive()) {
        currentTween.progress(1);
        return;
    }

    if (resolveAdvance) {
        resolveAdvance();
        resolveAdvance = null;
    }
}

function handleKeydown(e) {
    if (["Enter", "Space"].includes(e.code)) {
        e.preventDefault();
        handleAdvanceInput();
    }

    const index = parseInt(e.key) - 1;
    const choiceElement = document.querySelectorAll("#button-container button")[index];

    if (!isNaN(index) && choiceElement && !choiceElement.classList.contains("hidden") && currentNode.choices[index]) {
        e.preventDefault();
        handleChoice(currentNode.choices[index]);
    }
}

function setupInputListeners() {
    document.querySelector("#text-container").addEventListener("click", handleAdvanceInput);
    document.addEventListener("keydown", handleKeydown);
}

function renderChoices(choices) {
    const choicesContainer = document.querySelector("#button-container");
    choicesContainer.innerHTML = "";

    for (const choice of choices) {
        const choiceElement = parseHTML(
            `<button class="button window hidden" type="button">${choice.text}</button>`
        );
        choiceElement.addEventListener("click", () => handleChoice(choice));
        choicesContainer.appendChild(choiceElement);
    }

    animateChoices(Array.from(choicesContainer.children).reverse());
}

function animateChoices(choicesElements) {
    gsap.fromTo(
        choicesElements,
        {
            opacity: 0,
            y: 20,
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.1,
            clearProps: "all",
            onStart: () => {
                for (const element of choicesElements) {
                    element.classList.remove("hidden");
                }
            }
        }
    );
}

function handleChoice(choice) {
    updateStatElements(choice.stats);
    const nextNode = choice.next;
    currentNode = storyData[nextNode];

    PROGRESS.seenNodes.push(PROGRESS.currentNode);
    PROGRESS.choicesMade.push({
        node: PROGRESS.currentNode,
        choice: storyData[PROGRESS.currentNode].choices.findIndex(c => Object.is(c, choice))
    });
    PROGRESS.currentNode = nextNode;
    PROGRESS.currentLine = 0;
    if (SETTINGS.autosave) {
        saveJsonToLocalStorage("progress", PROGRESS);
    }

    const buttons = document.querySelectorAll("#button-container button");
    gsap.to(buttons, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
            for (const button of buttons) {
                button.classList.add("hidden");
            }
            displayStoryNode();
        }
    });
}

function updateStats(newStats) {
    for (const [key, value] of Object.entries(newStats)) {
        if (Object.hasOwn(STATS, key)) {
            STATS[key] = clamp(STATS[key] + value, 0, 100);
        }
    }

    if (SETTINGS.autosave) {
        saveJsonToLocalStorage("stats", STATS);
    }
}

function renderStatElements() {
    const statElements = document.querySelectorAll("[data-stat]");

    for (const element of statElements) {
        const statName = element.dataset.stat;
        const slider = element.querySelector("range-slider");

        animateSlider(slider, STATS[statName]);
    }
}

function animateSlider(slider, value) {
    gsap.to(slider, {
        duration: 0.5,
        ease: "power1.out",
        value,
    });
}

function updateStatElements(newStats) {
    updateStats(newStats);
    renderStatElements();
}

async function renderWarning(warningMessage) {
    const gamePage = document.getElementById("game");
    const warningElement = parseHTML(`
        <div id="warning" class="window">
            <h1>Warning</h1>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720
                178-200Zm330.5-51.5Q520-263 520-280t-11.5-28.5Q497-320
                480-320t-28.5 11.5Q440-297 440-280t11.5 28.5Q463-240
                480-240t28.5-11.5ZM440-360h80v-200h-80v200Zm40-100Z" />
            </svg>
            <h1>${warningMessage}</h1>
        </div>
    `);

    gamePage.appendChild(warningElement);

    await animateWarning(warningElement);
}

function animateWarning(warningElement) {
    return new Promise(resolve => {
        gsap.fromTo(
            warningElement,
            {
                opacity: 0,
                y: 20,
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                clearProps: "all",
                onComplete: () => resolve(),
            }
        );
    });
}

function removeWarning() {
    const element = document.querySelector("#warning");

    gsap.to(element, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
            element.remove();
        }
    });
}

function renderEnding(type) {
    const gamePage = document.getElementById("game");
    const element = parseHTML(`
        <div id="ending" class="window">
            <h1>Unlocked Ending:</h1>
            <h1>${ENDING_MAP[type] || type}</h1>
            <button class="button" type="button">Restart</button>
            <button class="button" data-route="/achievements" type="button">Achievements</button>
            <button class="button" data-route="/" type="button">Landing Page</button>
        </div>
    `);

    element.querySelector("button").addEventListener("click", (e) => {
        gsap.to(element, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.in"
        });

        const overlay = document.querySelector("#overlay");

        gsap.to(overlay, {
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                element.remove();
                overlay.remove();
                playAgain();
            }
        });
    });

    gamePage.appendChild(element);

    animateEnding(element);
}

function animateEnding(endingElement) {
    gsap.fromTo(
        endingElement,
        {
            opacity: 0,
            y: 20,
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
        }
    );
}

function renderOverlay(messages) {
    const overlay = parseHTML(`<div id="overlay"></div>`);
    overlay.addEventListener("click", handleAdvanceInput);
    document.querySelector("#game").appendChild(overlay);

    gsap.fromTo(
        overlay,
        {
            opacity: 0,
            backgroundColor: "rgba(0, 0, 0, 0)",
            backdropFilter: "blur(0rem)",
        },
        {
            opacity: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(0.1rem)",
            duration: 0.5,
            ease: "power2.out",
        }
    );
}

async function renderMessages(messages) {
    const elements = [];

    for (const message of messages) {
        const element = parseHTML(`
            <h1 class="message window">${message}</h1>
        `);

        document.querySelector("#game").appendChild(element);
        elements.push(element);

        await animateMessage(element);
        await waitForAdvance();
    }

    await gsap.to(elements, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
            elements.forEach(element => element.remove());
        }
    });
}

function animateMessage(element) {
    return new Promise(resolve => {
        gsap.fromTo(
            element,
            {
                opacity: 0,
                y: 20,
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => resolve(),
            }
        );
    });
}

function playAgain() {
    Object.assign(PROGRESS, DEFAULT_PROGRESS);
    Object.assign(STATS, DEFAULT_STATS);

    if (SETTINGS.autosave) {
        saveJsonToLocalStorage("progress", PROGRESS);
        saveJsonToLocalStorage("stats", STATS);
    }

    renderStatElements();
    animateWindowBackgroundColor("rgba(0, 140, 255, 0.44)");
    animateBackgroundImage("../images/background-1-small.jpg", "center left");

    currentNode = storyData[PROGRESS.currentNode];
    setTimeout(displayStoryNode, 500);
}

function preloadNextSceneImages(node) {
    if (!node?.choices) {
        return;
    }

    for (const choice of node.choices) {
        const nextNode = storyData[choice.next];

        if (nextNode?.backgroundImage) {
            preloadImage(nextNode.backgroundImage);
        }
    }
}

async function preloadImage(src) {
    if (!src || imageCache.has(src)) {
        return;
    }

    const img = new Image();
    img.src = src;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    if (img.decode) {
        await img.decode();
    }

    imageCache.add(src);
}

function animateBackgroundImage(newImage, newPosition) {
    const game = document.querySelector("#game");

    gsap.set([game.children, "#navigation"], {
        zIndex: 10,
    });

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${newImage})`,
        backgroundSize: "cover",
        backgroundPosition: newPosition,
        opacity: "0",
        zIndex: "1",
        pointerEvents: "none",
    });

    game.appendChild(overlay);

    gsap.to(overlay, {
        duration: 1,
        opacity: 1,
        ease: "power2.out",
        onComplete: () => {
            gsap.set(document.body, {
                css: {
                    "--bg-image": `url(${newImage})`,
                    "--bg-position": newPosition
                }
            });
            gsap.set([game.children, "#navigation"], {
                clearProps: "zIndex",
            });
            game.removeChild(overlay);
        }
    });
}

function animateWindowBackgroundColor(targetColor) {
    gsap.to(document.body, {
        duration: 1,
        ease: "power2.out",
        css: {
            "--window-bg": targetColor
        }
    });
}

async function applySceneBackground() {
    if (!currentNode?.backgroundImage) {
        return;
    }

    animateWindowBackgroundColor(currentNode.backgroundColor);
    animateBackgroundImage(
        currentNode.backgroundImage,
        currentNode.backgroundPosition
    );
    updateStatElements(currentNode.finalStats);
}

async function showWarningState() {
    const lowestStat = getLowestEntry(STATS);

    if (lowestStat.value < 10 && !currentNode?.isEnding) {
        currentNode = storyData["oxygenDepletion"];
        return displayStoryNode();
    } else if (lowestStat.value < 40 && !isWarningActive && !currentNode?.isEnding) {
        isWarningActive = true;
        animateWindowBackgroundColor("rgba(255, 0, 0, 0.44)");
        animateBackgroundImage("../images/background-2-small.jpg", "center");
        await renderWarning(`${STAT_MAP[lowestStat.key]} Level Critical`);
    } else if ((lowestStat.value >= 40 || currentNode?.isEnding) && isWarningActive) {
        isWarningActive = false;
        animateWindowBackgroundColor("rgba(0, 140, 255, 0.44)");
        animateBackgroundImage("../images/background-1-small.jpg", "center left");
        removeWarning();
    }
}

async function animateBinaryText() {
    const binaryElement = document.querySelector("#binary p");
    let duration = 0;

    binaryElement.textContent = stringToBinary(currentNode.text.join(" "), " ");

    for (const text of currentNode.text) {
        duration += 0.5 + text.length * (0.03 / SETTINGS.textSpeed);
    }

    gsap.fromTo(
        binaryElement,
        {
            x: "0%",
        },
        {
            x: "-100%",
            ease: "linear",
            duration: duration,
        }
    );
}

async function displayStoryNode() {
    preloadNextSceneImages(currentNode);

    await applySceneBackground();
    await showWarningState();
    await animateBinaryText();

    document.querySelector("#text-container h2").textContent = currentNode.title;
    await renderText(currentNode.text);

    if (currentNode?.isEnding) {
        unlockAndRenderAchievement(currentNode.endingType);
        renderOverlay();
        await renderMessages(currentNode.messages);
        renderEnding(currentNode.endingType);
        return;
    }

    renderChoices(currentNode.choices);
}

function setupStory() {
    renderStatElements();
    setupInputListeners();
    const gamePage = document.getElementById("game");
    let hasDisplayedNode = false;

    document.addEventListener("pagechange", (e) => {
        if (e.detail.routeId === "game" && !hasDisplayedNode) {
            displayStoryNode();
            hasDisplayedNode = true;
        }
    });

    if (window.location.pathname === "/game") {
        setTimeout(() => displayStoryNode(), 500);
        hasDisplayedNode = true;
    }
}

export {
    STATS,
    PROGRESS,
    renderStatElements,
    setupInputListeners,
    displayStoryNode,
    setupStory,
}