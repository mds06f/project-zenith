import { Router } from "express";
import { narrateController } from "../controllers/narrate.controller";

const router = Router();

router.get("/", narrateController);

export default router;
