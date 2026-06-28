import express from "express";
import {
    deleteTaskAttachment,
    downloadTaskAttachment,
    getTaskAttachments,
    uploadTaskAttachments,
} from "../controllers/attachmentController.js";

const attachmentRouter = express.Router();

attachmentRouter.get("/task/:taskId", getTaskAttachments);
attachmentRouter.post("/", uploadTaskAttachments);
attachmentRouter.get("/:id/download", downloadTaskAttachment);
attachmentRouter.delete("/:id", deleteTaskAttachment);

export default attachmentRouter;
