import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, "../uploads/task-attachments");

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

export const ensureUploadRoot = async () => {
    await fs.mkdir(uploadRoot, { recursive: true });
};

export const getAttachmentPath = (storageName) => {
    return path.join(uploadRoot, storageName);
};

export const sanitizeFileName = (fileName = "attachment") => {
    return path.basename(fileName).replace(/[^\w.\-() ]/g, "_").slice(0, 120) || "attachment";
};

export const parseDataUrl = (dataUrl = "") => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], "base64"),
    };
};

export const saveAttachmentFile = async ({ fileName, dataUrl }) => {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
        throw new Error("Invalid file payload");
    }

    if (parsed.buffer.length > MAX_ATTACHMENT_SIZE) {
        throw new Error("File size must be 5MB or less");
    }

    await ensureUploadRoot();

    const safeName = sanitizeFileName(fileName);
    const storageName = `${crypto.randomUUID()}-${safeName}`;
    await fs.writeFile(getAttachmentPath(storageName), parsed.buffer);

    return {
        storageName,
        fileType: parsed.mimeType,
        fileSize: parsed.buffer.length,
    };
};

export const removeAttachmentFile = async (storageName) => {
    try {
        await fs.unlink(getAttachmentPath(storageName));
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
};
