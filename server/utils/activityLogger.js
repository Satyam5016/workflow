import prisma from "../configs/prisma.js";

export const createActivity = async ({
    action,
    message,
    userId,
    workspaceId,
    projectId,
    taskId,
    metadata = {},
}) => {
    if (!action || !message || !workspaceId) return null;

    try {
        return await prisma.activity.create({
            data: {
                action,
                message,
                metadata,
                userId,
                workspaceId,
                projectId,
                taskId,
            },
        });
    } catch (error) {
        console.error("Failed to create activity:", error?.message || error);
        return null;
    }
};

export const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "empty";
    if (value instanceof Date) return value.toISOString();
    return String(value).replaceAll("_", " ").toLowerCase();
};

export const buildChangeSet = (before = {}, after = {}, fields = []) => {
    return fields.reduce((changes, field) => {
        const beforeValue = before[field] instanceof Date ? before[field].toISOString() : before[field];
        const afterValue = after[field] instanceof Date ? after[field].toISOString() : after[field];

        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
            changes[field] = {
                from: beforeValue ?? null,
                to: afterValue ?? null,
            };
        }

        return changes;
    }, {});
};
