import { Router } from "express";
import { adminLoginSchema } from "@exam-platform/shared";

import { requireAdmin, type AdminRequest } from "../../middleware/require-admin.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/http.js";
import { getAdminProfile, loginAdmin } from "./service.js";

export const adminAuthRouter = Router();

adminAuthRouter.post(
  "/login",
  validateBody(adminLoginSchema),
  asyncHandler(async (request, response) => {
    const { token, admin } = await loginAdmin(request.body.username, request.body.password);

    response.cookie("admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    response.json({ admin });
  })
);

adminAuthRouter.post("/logout", (_request, response) => {
  response.clearCookie("admin_session");
  response.status(204).send();
});

adminAuthRouter.get(
  "/me",
  requireAdmin,
  asyncHandler(async (request, response) => {
    const admin = await getAdminProfile((request as AdminRequest).admin!.adminId);
    response.json({ admin });
  })
);
