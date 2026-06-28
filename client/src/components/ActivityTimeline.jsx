import { formatDistanceToNow } from "date-fns";
import {
    CheckCircle2,
    CirclePlus,
    ClipboardList,
    MessageSquare,
    PenLine,
    Trash2,
    UserPlus,
    Users,
} from "lucide-react";

const activityStyles = {
    PROJECT_CREATED: { icon: CirclePlus, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    PROJECT_UPDATED: { icon: PenLine, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950" },
    PROJECT_MEMBER_ADDED: { icon: UserPlus, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    TASK_CREATED: { icon: ClipboardList, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    TASK_STATUS_CHANGED: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    TASK_ASSIGNEE_CHANGED: { icon: Users, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950" },
    TASK_UPDATED: { icon: PenLine, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950" },
    TASK_DELETED: { icon: Trash2, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    COMMENT_ADDED: { icon: MessageSquare, color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-800" },
    ATTACHMENT_ADDED: { icon: ClipboardList, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    ATTACHMENT_DELETED: { icon: Trash2, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    SUBTASK_ADDED: { icon: ClipboardList, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    SUBTASK_UPDATED: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    SUBTASK_DELETED: { icon: Trash2, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    TASK_LABELS_UPDATED: { icon: PenLine, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950" },
    TIME_ESTIMATE_UPDATED: { icon: PenLine, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950" },
    TIME_LOGGED: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    TIME_ENTRY_DELETED: { icon: Trash2, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    MILESTONE_CREATED: { icon: CirclePlus, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950" },
    MILESTONE_UPDATED: { icon: PenLine, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950" },
    MILESTONE_DELETED: { icon: Trash2, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    TASK_MILESTONE_UPDATED: { icon: PenLine, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950" },
    TASK_DEPENDENCIES_UPDATED: { icon: PenLine, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-950" },
};

const formatAction = (action = "") => {
    return action.replaceAll("_", " ").toLowerCase();
};

const ActivityTimeline = ({ activities = [], emptyText = "No activity yet" }) => {
    if (!activities.length) {
        return (
            <div className="p-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-zinc-600 dark:text-zinc-500" />
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {activities.map((activity) => {
                const style = activityStyles[activity.action] || activityStyles.TASK_UPDATED;
                const Icon = style.icon;

                return (
                    <div key={activity.id} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${style.bg}`}>
                                <Icon className={`size-4 ${style.color}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                                        <span className="font-medium">{activity.user?.name || "Someone"}</span>{" "}
                                        {activity.message}
                                    </p>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-500 shrink-0">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                    </span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                                        {formatAction(activity.action)}
                                    </span>
                                    {activity.project?.name && <span>{activity.project.name}</span>}
                                    {activity.task?.title && <span>{activity.task.title}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityTimeline;
