import prisma from "../configs/prisma.js";

export const getNotifications = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const limit = Math.min(Number(req.query.limit) || 30, 100);

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId, read: false },
            }),
        ]);

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id } = req.params;

        const notification = await prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { read: true },
        });

        res.json({ notification: updatedNotification, message: "Notification marked as read" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        const { userId } = await req.auth();

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
