import storyData from "../data/story.json" with { type: "json" };
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import {
    loadJsonFromLocalStorage,
    parseHTML,
    saveJsonToLocalStorage
} from "./utils.js";
import { SETTINGS } from "./settings.js";

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

let currentNode = storyData[PROGRESS.currentNode];
let currentTween = null;
let resolveAdvance = null;

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

    if (!isNaN(index) && choiceElement && !choiceElement.classList.contains("hidden")) {
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
            STATS[key] += value;
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

async function displayStoryNode() {
    document.querySelector("#text-container h2").textContent = currentNode.title;
    await renderText(currentNode.text);
    renderChoices(currentNode.choices);
}

export {
    STATS,
    PROGRESS,
    renderStatElements,
    setupInputListeners,
    displayStoryNode,
}