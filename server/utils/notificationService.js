import prisma from "../configs/prisma.js";

export const createNotification = async ({ userId, type, title, message, link, metadata = {} }) => {
    if (!userId || !type || !title || !message) return null;

    try {
        return await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
                metadata,
            },
        });
    } catch (error) {
        console.error("Failed to create notification:", error?.message || error);
        return null;
    }
};

export const createNotifications = async (notifications = []) => {
    const validNotifications = notifications.filter((notification) => (
        notification.userId && notification.type && notification.title && notification.message
    ));

    if (!validNotifications.length) return { count: 0 };

    try {
        return await prisma.notification.createMany({
            data: validNotifications,
        });
    } catch (error) {
        console.error("Failed to create notifications:", error?.message || error);
        return { count: 0 };
    }
};

export const taskLink = (task) => {
    return `/taskDetails?projectId=${task.projectId}&taskId=${task.id}`;
};

export const projectLink = (projectId, tab = "tasks") => {
    return `/projectsDetail?id=${projectId}&tab=${tab}`;
};
