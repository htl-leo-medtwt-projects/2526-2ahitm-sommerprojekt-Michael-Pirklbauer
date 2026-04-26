import gsap from "gsap";

const ROUTES = Object.freeze({
    "/": {
        id: "landing-page",
        title: "Last Signal",
        showNavigation: false,
    },
    "/settings": {
        id: "settings",
        title: "Last Signal - Settings",
        showNavigation: true,
    },
    "/achievements": {
        id: "achievements",
        title: "Last Signal - Achievements",
        showNavigation: true,
    },
    "/game": {
        id: "game",
        title: "Last Signal - Game",
        showNavigation: true,
    }
});

const navigationElement = document.getElementById("navigation");
let currentPage = null;
let isNavigating = false;

function showPage(next, showNavigation) {
    return new Promise(resolve => {
        const elements = showNavigation ? [next, navigationElement] : [next];

        next.classList.remove("hidden");
        if (showNavigation) {
            navigationElement.classList.remove("hidden");
        }

        gsap.fromTo(elements,
            {
                opacity: 0,
                y: 20
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: "power2.out",
                onComplete: () => resolve()
            }
        );
    });
}

function hidePage(current, showNavigation) {
    return new Promise(resolve => {
        const elements = !showNavigation ? [current, navigationElement] : [current];

        gsap.to(elements, {
            opacity: 0,
            y: -20,
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
                current.classList.add("hidden");
                if (!showNavigation) {
                    navigationElement.classList.add("hidden");
                }
                resolve();
            }
        });
    });
}

async function navigate(path, pushState = true) {
    if (isNavigating) {
        return;
    }
    isNavigating = true;

    const route = ROUTES[path] || ROUTES["/"];
    const nextPage = document.getElementById(route.id);

    if (currentPage === nextPage) {
        isNavigating = false;
        return;
    }

    if (currentPage) {
        await hidePage(currentPage, route.showNavigation);
    }

    await showPage(nextPage, route.showNavigation);
    currentPage = nextPage;
    document.title = route.title;

    if (pushState) {
        history.pushState({}, "", path);
    }

    isNavigating = false;
}

function setupNavigation() {
    document.addEventListener("click", e => {
        const button = e.target.closest("[data-route]");
        if (!button) {
            return;
        }

        e.preventDefault();
        const path = button.dataset.route;
        navigate(path);
    });

    window.addEventListener("popstate", () => {
        const path = ROUTES[window.location.pathname] ? window.location.pathname : "/";
        navigate(path, false);
    });

    document.querySelector("#back-button").addEventListener("click", () => {
        history.back();
    });

    const path = window.location.pathname;
    const route = ROUTES[path] || ROUTES["/"];

    document.querySelectorAll("body > div").forEach(element => {
        element.classList.add("hidden");
    });

    const startPage = document.getElementById(route.id);
    startPage.classList.remove("hidden");
    navigationElement.classList.toggle("hidden", !route.showNavigation);
    currentPage = startPage;
    document.title = route.title;
}

export {
    ROUTES,
    navigate,
    setupNavigation,
}