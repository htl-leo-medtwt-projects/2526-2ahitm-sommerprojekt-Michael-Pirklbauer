/**
 * Converts a string to its binary representation
 * @param {string} str 
 * @param {string} separator 
 * @returns {string}
 */
function stringToBinary(str, separator = '') {
    return [...new TextEncoder().encode(str)]
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join(separator);
}

/**
 * Converts a binary string to its text representation
 * @param {string} binary 
 * @param {string} separator 
 * @returns {string}
 */
function binaryToString(binary, separator = '') {
    const bytes = (separator
        ? binary.split(separator)
        : binary.match(/.{1,8}/g)
    ).map(byte => parseInt(byte, 2));

    return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Save an object as JSON string to localStorage
 * @param {string} key 
 * @param {object} data 
 */
function saveJsonToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load an object from a JSON string in localStorage
 * @param {string} key 
 * @returns {object}
 */
function loadJsonFromLocalStorage(key) {
    const jsonData = localStorage.getItem(key);
    return jsonData ? JSON.parse(jsonData) : {};
}

/**
 * Parses an HTML string into a DOM element or array of elements
 * @param {string} htmlString 
 * @returns {Element | Element[]}
 */
function parseHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const elements = Array.from(doc.body.children);
    return elements.length === 1 ? elements[0] : elements;
}

/**
 * Formats a date string into a localized date format
 * @param {string} date 
 * @returns {string}
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

/**
 * Replaces all non-whitespace characters in a string with a replacement character
 * @param {string} text 
 * @param {string} replacement 
 * @returns {string}
 */
function censorText(text, replacement = "█") {
    return text.replace(/[^\s]/g, replacement);
}

/**
 * Checks if the scrollbar is inside the element (overlay) or outside (takes space)
 * @returns {boolean}
 */
function isScrollbarInsideElement() {
    const div = document.createElement('div');

    Object.assign(div.style, {
        width: '100px',
        height: '100px',
        overflow: 'scroll',
        position: 'absolute',
        visibility: 'hidden',
        boxSizing: 'content-box',
        padding: '0',
        margin: '0',
        border: '0',
    });

    try {
        document.body.appendChild(div);
        return (div.clientWidth === div.offsetWidth);
    } catch {
        return false;
    } finally {
        div.remove();
    }
}

/**
 * Gets the entry with the lowest value from an object
 * @param {object} obj 
 * @returns {{ key: string, value: any }}
 */
function getLowestEntry(obj) {
    const [key, value] = Object.entries(obj).reduce((min, entry) =>
        entry[1] < min[1] ? entry : min
    );

    return { key, value };
}

/**
 * Clamps a value between a minimum and maximum
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export {
    stringToBinary,
    binaryToString,
    saveJsonToLocalStorage,
    loadJsonFromLocalStorage,
    parseHTML,
    formatDate,
    censorText,
    isScrollbarInsideElement,
    getLowestEntry,
    clamp
}