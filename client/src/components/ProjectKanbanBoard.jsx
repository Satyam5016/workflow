import { useMemo, useState } from "react";
import { format, isPast, isToday } from "date-fns";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { BugIcon, CalendarIcon, CheckCircle2Icon, CircleIcon, Clock3Icon, GitBranchIcon, GripVerticalIcon, MessageSquareIcon, SquareIcon, ZapIcon } from "lucide-react";
import api from "../configs/api";
import { updateTask } from "../features/workspaceSlice";

const columns = [
    { key: "TODO", label: "To Do", icon: CircleIcon, accent: "border-slate-200 dark:border-zinc-800" },
    { key: "IN_PROGRESS", label: "In Progress", icon: Clock3Icon, accent: "border-amber-200 dark:border-amber-500/30" },
    { key: "DONE", label: "Done", icon: CheckCircle2Icon, accent: "border-emerald-200 dark:border-emerald-500/30" },
];

const typeIcons = {
    BUG: { icon: BugIcon, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: ZapIcon, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: SquareIcon, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: MessageSquareIcon, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquareIcon, color: "text-amber-600 dark:text-amber-400" },
};

const priorityStyles = {
    LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const getLoggedHours = (task) => {
    return (task.timeEntries || []).reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
};

const ProjectKanbanBoard = ({ tasks = [] }) => {
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [draggedTaskId, setDraggedTaskId] = useState("");
    const [dragOverStatus, setDragOverStatus] = useState("");
    const [updatingTaskId, setUpdatingTaskId] = useState("");

    const tasksByStatus = useMemo(() => {
        return columns.reduce((groups, column) => {
            groups[column.key] = tasks.filter((task) => task.status === column.key);
            return groups;
        }, {});
    }, [tasks]);

    const moveTask = async (taskId, newStatus) => {
        const task = tasks.find((item) => item.id === taskId);
        if (!task || task.status === newStatus || updatingTaskId) return;

        try {
            setUpdatingTaskId(taskId);
            const token = await getToken();
            const { data } = await api.put(`/api/tasks/${taskId}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            dispatch(updateTask(data.task || { ...task, status: newStatus }));
            toast.success("Task moved");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setUpdatingTaskId("");
            setDraggedTaskId("");
            setDragOverStatus("");
        }
    };

    const handleDrop = (status) => {
        if (!draggedTaskId) return;
        moveTask(draggedTaskId, status);
    };

    const getDueDateStyle = (task) => {
        if (!task.due_date || task.status === "DONE") return "text-zinc-500 dark:text-zinc-400";
        const dueDate = new Date(task.due_date);
        if (isToday(dueDate)) return "text-amber-700 dark:text-amber-400";
        if (isPast(dueDate)) return "text-red-700 dark:text-red-400";
        return "text-zinc-500 dark:text-zinc-400";
    };

    return (
        <div className="overflow-x-auto pb-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
                {columns.map((column) => {
                    const ColumnIcon = column.icon;
                    const columnTasks = tasksByStatus[column.key] || [];
                    const isActiveDrop = dragOverStatus === column.key;

                    return (
                        <section
                            key={column.key}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragOverStatus(column.key);
                            }}
                            onDragLeave={() => setDragOverStatus("")}
                            onDrop={() => handleDrop(column.key)}
                            className={`min-h-[28rem] rounded-lg border ${column.accent} bg-white dark:bg-zinc-950 shadow-sm transition ${isActiveDrop ? "ring-2 ring-teal-400" : ""}`}
                        >
                            <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800 p-4 rounded-t-lg">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <ColumnIcon className="size-4 text-zinc-700 dark:text-zinc-300" />
                                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{column.label}</h2>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {columnTasks.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 space-y-3">
                                {columnTasks.length === 0 ? (
                                    <div className="h-28 rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-500">
                                        Drop tasks here
                                    </div>
                                ) : (
                                    columnTasks.map((task) => {
                                        const typeStyle = typeIcons[task.type] || typeIcons.TASK;
                                        const TypeIcon = typeStyle.icon;
                                        const isDragging = draggedTaskId === task.id;

                                        return (
                                            <article
                                                key={task.id}
                                                draggable
                                                onDragStart={(event) => {
                                                    event.dataTransfer.effectAllowed = "move";
                                                    setDraggedTaskId(task.id);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedTaskId("");
                                                    setDragOverStatus("");
                                                }}
                                                onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                                                className={`rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm cursor-pointer transition hover:-translate-y-0.5 hover:border-teal-200 dark:hover:border-teal-500/30 hover:shadow-md ${isDragging ? "opacity-60" : ""}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">{task.title}</h3>
                                                        {task.description && (
                                                            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{task.description}</p>
                                                        )}
                                                    </div>
                                                    <GripVerticalIcon className="size-4 shrink-0 text-zinc-400" />
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 text-xs ${typeStyle.color}`}>
                                                        <TypeIcon className="size-3.5" />
                                                        {task.type}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${priorityStyles[task.priority] || priorityStyles.MEDIUM}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                        {getLoggedHours(task).toFixed(1)}h / {Number(task.estimated_hours || 0).toFixed(1)}h
                                                    </span>
                                                    {task.milestone && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                            {task.milestone.name}
                                                        </span>
                                                    )}
                                                    {(task.dependsOn || []).length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                            <GitBranchIcon className="size-3" /> {task.dependsOn.length}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <div className={`flex items-center gap-1 text-xs ${getDueDateStyle(task)}`}>
                                                        <CalendarIcon className="size-3.5" />
                                                        {task.due_date ? format(new Date(task.due_date), "dd MMM") : "No due date"}
                                                    </div>
                                                    {task.assignee ? (
                                                        <div className="flex items-center gap-1 min-w-0">
                                                            <img src={task.assignee.image} className="size-5 rounded-full" alt="avatar" />
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-24">{task.assignee.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400 dark:text-zinc-500">Unassigned</span>
                                                    )}
                                                </div>

                                                {updatingTaskId === task.id && (
                                                    <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">Moving task...</p>
                                                )}
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectKanbanBoard;
