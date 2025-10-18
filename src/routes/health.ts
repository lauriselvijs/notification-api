import { Router } from "express";
import { getHealthStatus } from "../controllers/healthController.ts";

export const router = Router();

router.get("/", getHealthStatus);

export default router;
