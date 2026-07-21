import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vendashuRouter from "./vendashu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vendashuRouter);

export default router;
