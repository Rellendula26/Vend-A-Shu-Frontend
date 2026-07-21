import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vendashuRouter from "./vendashu";
import photosRouter from "./photos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vendashuRouter);
router.use(photosRouter);

export default router;
