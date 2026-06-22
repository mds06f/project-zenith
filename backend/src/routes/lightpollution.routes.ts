import { Router } from "express";
import { lightPollutionController } from "../controllers/lightpollution.controller";

const router = Router();

router.get("/", lightPollutionController);

export default router;