import storyData from "../data/story.json" with { type: "json" };
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";
import {
    loadJsonFromLocalStorage,
    parseHTML
} from "./utils.js";

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

let currentNode = storyData.start;

async function renderText(lines) {
    const textElement = document.querySelector("#text-container p");

    for (const line of lines) {
        textElement.textContent = line;
        await animateText(textElement);
    }
}

async function animateText(textElement) {
    return new Promise(resolve => {
        const split = new SplitText(textElement, {
            type: "chars, words",
            autoSplit: true,
            smartWrap: true
        });

        gsap.from(split.chars, {
            opacity: 0,
            stagger: 0.03,
            onComplete: () => {
                split.revert();
                resolve();
            }
        });
    });
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
    updateStats(choice.stats);
    const nextNode = choice.next;
    currentNode = storyData[nextNode];

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
    const statElements = document.querySelectorAll("[data-stat]");

    for (const element of statElements) {
        const statName = element.dataset.stat;

        STATS[statName] += newStats[statName];
        const slider = element.querySelector("range-slider");

        gsap.fromTo(slider, {
            duration: 0.5,
            ease: "power1.out",
            value: slider.value,
        }, {
            value: STATS[statName],
        })
    }
}

async function displayStoryNode() {
    document.querySelector("#text-container h2").textContent = currentNode.title;
    await renderText(currentNode.text);
    renderChoices(currentNode.choices);
}

export {
    STATS,
    displayStoryNode,
}