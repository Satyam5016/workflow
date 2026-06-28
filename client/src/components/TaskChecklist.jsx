import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckSquareIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";

const TaskChecklist = ({ task }) => {
    const { getToken } = useAuth();
    const [subtasks, setSubtasks] = useState(task?.subtasks || []);
    const [newTitle, setNewTitle] = useState("");
    const [editingId, setEditingId] = useState("");
    const [editingTitle, setEditingTitle] = useState("");
    const [busyId, setBusyId] = useState("");
    const [creating, setCreating] = useState(false);

    const completedCount = useMemo(() => subtasks.filter((item) => item.completed).length, [subtasks]);
    const progress = subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0;

    const fetchSubtasks = useCallback(async () => {
        if (!task?.id) return;

        try {
            const token = await getToken();
            const { data } = await api.get(`/api/subtasks/task/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubtasks(data.subtasks || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [getToken, task?.id]);

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!newTitle.trim()) return;

        try {
            setCreating(true);
            const token = await getToken();
            const { data } = await api.post("/api/subtasks", { taskId: task.id, title: newTitle }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubtasks((prev) => [...prev, data.subtask]);
            setNewTitle("");
            toast.success(data.message || "Checklist item added");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (subtask) => {
        try {
            setBusyId(subtask.id);
            const token = await getToken();
            const { data } = await api.put(`/api/subtasks/${subtask.id}`, { completed: !subtask.completed }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubtasks((prev) => prev.map((item) => item.id === subtask.id ? data.subtask : item));
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setBusyId("");
        }
    };

    const startEdit = (subtask) => {
        setEditingId(subtask.id);
        setEditingTitle(subtask.title);
    };

    const saveEdit = async () => {
        if (!editingId || !editingTitle.trim()) {
            setEditingId("");
            setEditingTitle("");
            return;
        }

        try {
            setBusyId(editingId);
            const token = await getToken();
            const { data } = await api.put(`/api/subtasks/${editingId}`, { title: editingTitle }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubtasks((prev) => prev.map((item) => item.id === editingId ? data.subtask : item));
            setEditingId("");
            setEditingTitle("");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setBusyId("");
        }
    };

    const handleDelete = async (subtaskId) => {
        const confirmed = window.confirm("Delete this checklist item?");
        if (!confirmed) return;

        try {
            setBusyId(subtaskId);
            const token = await getToken();
            const { data } = await api.delete(`/api/subtasks/${subtaskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubtasks((prev) => prev.filter((item) => item.id !== subtaskId));
            toast.success(data.message || "Checklist item deleted");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setBusyId("");
        }
    };

    useEffect(() => {
        setSubtasks(task?.subtasks || []);
    }, [task?.subtasks]);

    useEffect(() => {
        fetchSubtasks();
    }, [fetchSubtasks]);

    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    <CheckSquareIcon className="size-5" /> Checklist ({completedCount}/{subtasks.length})
                </h2>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{progress}%</span>
            </div>

            <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden mb-4">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <form onSubmit={handleCreate} className="flex items-center gap-2 mb-4">
                <input
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder="Add checklist item"
                    className="min-w-0 flex-1 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" disabled={creating || !newTitle.trim()} className="size-9 flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50" title="Add checklist item">
                    <PlusIcon className="size-4" />
                </button>
            </form>

            {subtasks.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No checklist items yet.</p>
            ) : (
                <div className="space-y-2">
                    {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 rounded border border-zinc-200 dark:border-zinc-800 p-3">
                            <input
                                type="checkbox"
                                checked={subtask.completed}
                                disabled={busyId === subtask.id}
                                onChange={() => handleToggle(subtask)}
                                className="size-4 accent-blue-600"
                            />

                            {editingId === subtask.id ? (
                                <input
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") saveEdit();
                                        if (event.key === "Escape") {
                                            setEditingId("");
                                            setEditingTitle("");
                                        }
                                    }}
                                    autoFocus
                                    className="min-w-0 flex-1 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            ) : (
                                <button type="button" onClick={() => startEdit(subtask)} className={`min-w-0 flex-1 text-left text-sm ${subtask.completed ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}`}>
                                    {subtask.title}
                                </button>
                            )}

                            <button type="button" onClick={() => handleDelete(subtask.id)} disabled={busyId === subtask.id} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950" title="Delete checklist item">
                                <Trash2Icon className="size-4 text-red-600 dark:text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskChecklist;
