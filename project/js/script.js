import { setupNavigation } from "./navigation.js";
import { setupSettings } from "./settings.js";
import {
    displayStoryNode,
    renderStatElements,
    setupInputListeners
} from "./story.js";

setupNavigation();
setupSettings();
renderStatElements();
setupInputListeners();
displayStoryNode();