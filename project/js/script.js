import { setupNavigation } from "./navigation.js";
import { setupSettings } from "./settings.js";
import {
    displayStoryNode,
    renderStatElements
} from "./story.js";

setupNavigation();
setupSettings();
renderStatElements();
displayStoryNode();