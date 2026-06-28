import prisma from "../configs/prisma.js";
import { createActivity } from "../utils/activityLogger.js";
import { getAttachmentPath, removeAttachmentFile, saveAttachmentFile, sanitizeFileName } from "../utils/fileStorage.js";

const includeAttachmentUser = {
    user: { select: { id: true, name: true, email: true, image: true } },
};

const getTaskForMember = async (taskId, userId) => {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: {
                include: {
                    members: true,
                    workspace: { include: { members: true } },
                },
            },
        },
    });

    if (!task) return { error: { status: 404, message: "Task not found" } };

    const isProjectMember = task.project.members.some((member) => member.userId === userId);
    const isWorkspaceMember = task.project.workspace.members.some((member) => member.userId === userId);

    if (!isProjectMember && !isWorkspaceMember) {
        return { error: { status: 403, message: "You are not a member of this task's project" } };
    }

    return { task };
};

export const getTaskAttachments = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const { error } = await getTaskForMember(taskId, userId);

        if (error) return res.status(error.status).json({ message: error.message });

        const attachments = await prisma.attachment.findMany({
            where: { taskId },
            include: includeAttachmentUser,
            orderBy: { createdAt: "desc" },
        });

        res.json({ attachments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const uploadTaskAttachments = async (req, res) => {
    const savedFiles = [];

    try {
        const { userId } = await req.auth();
        const { taskId, files = [] } = req.body;

        if (!taskId || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: "Task ID and files are required" });
        }

        if (files.length > 5) {
            return res.status(400).json({ message: "You can upload up to 5 files at once" });
        }

        const { task, error } = await getTaskForMember(taskId, userId);
        if (error) return res.status(error.status).json({ message: error.message });

        const createdAttachments = [];

        for (const file of files) {
            const fileName = sanitizeFileName(file.name);
            const saved = await saveAttachmentFile({ fileName, dataUrl: file.dataUrl });
            savedFiles.push(saved.storageName);

            const attachment = await prisma.attachment.create({
                data: {
                    taskId,
                    userId,
                    fileName,
                    fileType: saved.fileType,
                    fileSize: saved.fileSize,
                    storageName: saved.storageName,
                },
                include: includeAttachmentUser,
            });

            createdAttachments.push(attachment);
        }

        await createActivity({
            action: "ATTACHMENT_ADDED",
            message: `added ${createdAttachments.length} attachment${createdAttachments.length > 1 ? "s" : ""} to "${task.title}"`,
            userId,
            workspaceId: task.project.workspaceId,
            projectId: task.projectId,
            taskId,
            metadata: {
                attachmentIds: createdAttachments.map((attachment) => attachment.id),
                fileNames: createdAttachments.map((attachment) => attachment.fileName),
            },
        });

        res.status(201).json({ attachments: createdAttachments, message: "Attachment uploaded successfully" });
    } catch (error) {
        await Promise.all(savedFiles.map((storageName) => removeAttachmentFile(storageName)));
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const downloadTaskAttachment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: { task: { include: { project: { include: { members: true, workspace: { include: { members: true } } } } } } },
        });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        const isProjectMember = attachment.task.project.members.some((member) => member.userId === userId);
        const isWorkspaceMember = attachment.task.project.workspace.members.some((member) => member.userId === userId);

        if (!isProjectMember && !isWorkspaceMember) {
            return res.status(403).json({ message: "You are not allowed to download this attachment" });
        }

        res.download(getAttachmentPath(attachment.storageName), attachment.fileName);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteTaskAttachment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const attachment = await prisma.attachment.findUnique({
            where: { id },
            include: {
                task: {
                    include: {
                        project: { include: { members: true, workspace: { include: { members: true } } } },
                    },
                },
            },
        });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        const isUploader = attachment.userId === userId;
        const isProjectLead = attachment.task.project.team_lead === userId;
        const isWorkspaceAdmin = attachment.task.project.workspace.members.some(
            (member) => member.userId === userId && member.role === "ADMIN"
        );

        if (!isUploader && !isProjectLead && !isWorkspaceAdmin) {
            return res.status(403).json({ message: "Only the uploader, project lead, or workspace admin can delete this attachment" });
        }

        await prisma.attachment.delete({ where: { id } });
        await removeAttachmentFile(attachment.storageName);

        await createActivity({
            action: "ATTACHMENT_DELETED",
            message: `deleted attachment "${attachment.fileName}" from "${attachment.task.title}"`,
            userId,
            workspaceId: attachment.task.project.workspaceId,
            projectId: attachment.task.projectId,
            taskId: attachment.taskId,
            metadata: {
                attachmentId: attachment.id,
                fileName: attachment.fileName,
            },
        });

        res.json({ message: "Attachment deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
