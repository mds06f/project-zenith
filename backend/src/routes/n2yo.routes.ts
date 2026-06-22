import { Router } from "express";
import { n2yoController } from "../controllers/n2yo.controller";

const router = Router();

router.get(
    "/passes",
    n2yoController
);

export default router;