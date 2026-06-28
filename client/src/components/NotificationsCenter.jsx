import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, CheckCheckIcon, InboxIcon, MessageSquareIcon, UsersIcon, ClipboardCheckIcon, CalendarClockIcon, FolderPenIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../configs/api";

const notificationIcons = {
    TASK_ASSIGNED: ClipboardCheckIcon,
    TASK_DUE_SOON: CalendarClockIcon,
    TASK_DUE: CalendarClockIcon,
    COMMENT_ADDED: MessageSquareIcon,
    WORKSPACE_INVITE: UsersIcon,
    PROJECT_MEMBER_ADDED: UsersIcon,
    PROJECT_UPDATED: FolderPenIcon,
};

const NotificationsCenter = () => {
    const { getToken, isSignedIn } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const unreadLabel = useMemo(() => unreadCount > 9 ? "9+" : String(unreadCount), [unreadCount]);

    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) return;

        try {
            setLoading(true);
            const token = await getToken();
            const { data } = await api.get("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [getToken, isSignedIn]);

    const markRead = async (notification) => {
        if (!notification.read) {
            try {
                const token = await getToken();
                await api.put(`/api/notifications/${notification.id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
                setUnreadCount((count) => Math.max(count - 1, 0));
            } catch (error) {
                toast.error(error?.response?.data?.message || error.message);
                return;
            }
        }

        setOpen(false);
        if (notification.link) navigate(notification.link);
    };

    const markAllRead = async () => {
        try {
            const token = await getToken();
            await api.put("/api/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
            setUnreadCount(0);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <div className="relative">
            <button onClick={() => setOpen((prev) => !prev)} className="relative size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95" title="Notifications">
                <BellIcon className="size-4 text-gray-800 dark:text-gray-200" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                        {unreadLabel}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{unreadCount} unread</p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Mark all as read">
                                <CheckCheckIcon className="size-4 text-zinc-600 dark:text-zinc-300" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <InboxIcon className="size-8 mx-auto mb-3 text-zinc-400" />
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{loading ? "Loading notifications..." : "No notifications yet"}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {notifications.map((notification) => {
                                    const Icon = notificationIcons[notification.type] || BellIcon;

                                    return (
                                        <button key={notification.id} onClick={() => markRead(notification)} className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800">
                                                    <Icon className="size-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{notification.title}</p>
                                                        {!notification.read && <span className="mt-1 size-2 rounded-full bg-blue-500 shrink-0" />}
                                                    </div>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{notification.message}</p>
                                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsCenter;
