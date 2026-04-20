/**
 * Converts a string to its binary representation
 * @param {string} str 
 * @param {string} separator 
 * @returns {string}
 */
function stringToBinary(str, separator = '') {
    return str
        .split('')
        .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join(separator);
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

export {
    stringToBinary,
    saveJsonToLocalStorage,
    loadJsonFromLocalStorage,
    parseHTML,
}