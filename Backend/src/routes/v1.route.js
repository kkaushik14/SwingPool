import { Router } from "express";

import {
  adminRouter,
  authRouter,
  charitiesRouter,
  drawsRouter,
  notificationsRouter,
  paymentsRouter,
  reportsRouter,
  scoresRouter,
  subscriptionsRouter,
  usersRouter,
  winnersRouter,
} from "../components/index.js";
import { healthRouter } from "./health.route.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/payments", paymentsRouter);
router.use("/charities", charitiesRouter);
router.use("/scores", scoresRouter);
router.use("/draws", drawsRouter);
router.use("/winners", winnersRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/reports", reportsRouter);

export { router as v1Router };
