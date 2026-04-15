import gsap from "gsap";

const ROUTES = Object.freeze({
    "/": "landing-page",
    "/settings": "settings",
    "/achievements": "achievements",
    "/game": "game"
});

let currentPage = null;
let isNavigating = false;

function showPage(next) {
    return new Promise(resolve => {
        next.classList.remove("hidden");

        gsap.fromTo(next,
            {
                opacity: 0,
                y: 20
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: "power2.out",
                onComplete: () => resolve(),
            }
        );
    });
}

function hidePage(current) {
    return new Promise(resolve => {
        gsap.to(current, {
            opacity: 0,
            y: -20,
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
                current.classList.add("hidden");
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

    const id = ROUTES[path] || ROUTES["/"];
    const nextPage = document.getElementById(id);

    if (currentPage === nextPage) {
        isNavigating = false;
        return;
    }

    if (currentPage) {
        await hidePage(currentPage);
    }

    await showPage(nextPage);
    currentPage = nextPage;

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
        navigate(window.location.pathname, false);
    });

    const path = window.location.pathname;
    const id = ROUTES[path] || ROUTES["/"];

    document.querySelectorAll("body > div").forEach(element => {
        element.classList.add("hidden");
    });

    const startPage = document.getElementById(id);
    startPage.classList.remove("hidden");
    currentPage = startPage;
}

export {
    ROUTES,
    navigate,
    setupNavigation,
}