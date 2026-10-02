import { Router } from "express";

import { paymentController } from "./payment.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/orders/:orderId/esewa/initiate",
  requireAuth,
  paymentController.initiateEsewaPayment
);

router.get(
  "/esewa/success",
  paymentController.esewaSuccess
);

router.get(
  "/esewa/failure",
  paymentController.esewaFailure
);

export default router;