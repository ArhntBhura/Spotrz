import { Router } from "express";
import { getSeedStatus, startSeed } from "../seed/seed-job.js";

export const adminRouter = Router();

adminRouter.post("/seed", (req, res) => {
    if (process.env.SEED_ENABLED !== "true") {
        return res.status(404).json({ error: "Seed endpoint is disabled." });
    }

    if (!startSeed()) {
        return res.status(409).json({ error: "A seed job is already running." });
    }

    return res.status(202).json({ data: getSeedStatus() });
});

adminRouter.get("/seed/status", (req, res) => {
    if (process.env.SEED_ENABLED !== "true") {
        return res.status(404).json({ error: "Seed endpoint is disabled." });
    }

    return res.json({ data: getSeedStatus() });
});
