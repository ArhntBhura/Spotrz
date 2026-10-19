import { runSeed } from "./seed.js";

let state = {
    status: "idle",
    startedAt: null,
    finishedAt: null,
    error: null,
};

export function getSeedStatus() {
    return { ...state };
}

export function startSeed() {
    if (state.status === "running") {
        return false;
    }

    state = {
        status: "running",
        startedAt: new Date().toISOString(),
        finishedAt: null,
        error: null,
    };

    runSeed()
        .then(() => {
            state = { ...state, status: "completed", finishedAt: new Date().toISOString() };
        })
        .catch((error) => {
            console.error("Seed job failed:", error);
            state = {
                ...state,
                status: "failed",
                finishedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Seed job failed.",
            };
        });

    return true;
}
