import express from "express";
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", getNotifications);
notificationRouter.put("/read-all", markAllNotificationsRead);
notificationRouter.put("/:id/read", markNotificationRead);

export default notificationRouter;
