import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Clock3Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api";

const sumHours = (entries = []) => entries.reduce((total, entry) => total + Number(entry.hours || 0), 0);

const TaskTimeTracking = ({ task, project }) => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [entries, setEntries] = useState(task?.timeEntries || []);
    const [estimatedHours, setEstimatedHours] = useState(Number(task?.estimated_hours || 0));
    const [estimateInput, setEstimateInput] = useState(String(task?.estimated_hours || 0));
    const [hours, setHours] = useState("");
    const [note, setNote] = useState("");
    const [loggedAt, setLoggedAt] = useState(new Date().toISOString().split("T")[0]);
    const [savingEstimate, setSavingEstimate] = useState(false);
    const [loggingTime, setLoggingTime] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const actualHours = useMemo(() => sumHours(entries), [entries]);
    const remainingHours = Math.max(estimatedHours - actualHours, 0);
    const progress = estimatedHours > 0 ? Math.min(Math.round((actualHours / estimatedHours) * 100), 100) : 0;
    const isOverEstimate = estimatedHours > 0 && actualHours > estimatedHours;

    const canDeleteEntry = (entry) => {
        return entry.user?.id === user?.id || project?.team_lead === user?.id;
    };

    const fetchTimeEntries = useCallback(async () => {
        if (!task?.id) return;

        try {
            const token = await getToken();
            const { data } = await api.get(`/api/time-entries/task/${task.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEntries(data.entries || []);
            setEstimatedHours(Number(data.estimatedHours || 0));
            setEstimateInput(String(data.estimatedHours || 0));
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [getToken, task?.id]);

    const handleEstimateSave = async (event) => {
        event.preventDefault();
        const nextEstimate = Number(estimateInput);
        if (Number.isNaN(nextEstimate) || nextEstimate < 0) {
            toast.error("Estimate must be zero or more");
            return;
        }

        try {
            setSavingEstimate(true);
            const token = await getToken();
            const { data } = await api.put(`/api/time-entries/task/${task.id}/estimate`, { estimatedHours: nextEstimate }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEstimatedHours(Number(data.estimatedHours || nextEstimate));
            toast.success(data.message || "Estimate updated");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setSavingEstimate(false);
        }
    };

    const handleLogTime = async (event) => {
        event.preventDefault();
        const numericHours = Number(hours);
        if (Number.isNaN(numericHours) || numericHours <= 0) {
            toast.error("Enter positive hours");
            return;
        }

        try {
            setLoggingTime(true);
            const token = await getToken();
            const { data } = await api.post("/api/time-entries", {
                taskId: task.id,
                hours: numericHours,
                note,
                loggedAt,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEntries((prev) => [data.entry, ...prev]);
            setHours("");
            setNote("");
            toast.success(data.message || "Time logged");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoggingTime(false);
        }
    };

    const handleDelete = async (entryId) => {
        const confirmed = window.confirm("Delete this time entry?");
        if (!confirmed) return;

        try {
            setDeletingId(entryId);
            const token = await getToken();
            const { data } = await api.delete(`/api/time-entries/${entryId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
            toast.success(data.message || "Time entry deleted");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setDeletingId("");
        }
    };

    useEffect(() => {
        setEntries(task?.timeEntries || []);
        setEstimatedHours(Number(task?.estimated_hours || 0));
        setEstimateInput(String(task?.estimated_hours || 0));
    }, [task?.timeEntries, task?.estimated_hours]);

    useEffect(() => {
        fetchTimeEntries();
    }, [fetchTimeEntries]);

    return (
        <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Clock3Icon className="size-5" /> Time Tracking
                </h2>
                <span className={`text-xs ${isOverEstimate ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {actualHours.toFixed(1)}h / {estimatedHours.toFixed(1)}h
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Estimated</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{estimatedHours.toFixed(1)}h</p>
                </div>
                <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Logged</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{actualHours.toFixed(1)}h</p>
                </div>
                <div className="rounded border border-zinc-200 dark:border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{isOverEstimate ? "Over" : "Left"}</p>
                    <p className={`text-lg font-semibold ${isOverEstimate ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isOverEstimate ? (actualHours - estimatedHours).toFixed(1) : remainingHours.toFixed(1)}h
                    </p>
                </div>
            </div>

            <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden mb-4">
                <div className={`h-full transition-all ${isOverEstimate ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
            </div>

            <form onSubmit={handleEstimateSave} className="flex items-end gap-2 mb-4">
                <div className="flex-1">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">Estimate hours</label>
                    <input type="number" min="0" step="0.25" value={estimateInput} onChange={(event) => setEstimateInput(event.target.value)} className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={savingEstimate} className="px-3 py-2 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm disabled:opacity-50">
                    Save
                </button>
            </form>

            <form onSubmit={handleLogTime} className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <input type="number" min="0.25" max="24" step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} placeholder="Hours" className="rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input type="date" value={loggedAt} onChange={(event) => setLoggedAt(event.target.value)} className="rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Work note" className="min-w-0 flex-1 rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <button type="submit" disabled={loggingTime || !hours} className="size-9 flex items-center justify-center rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50" title="Log time">
                        <PlusIcon className="size-4" />
                    </button>
                </div>
            </form>

            {entries.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No time logged yet.</p>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 rounded border border-zinc-200 dark:border-zinc-800 p-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{Number(entry.hours).toFixed(1)}h</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {entry.user?.name || "Unknown"} · {format(new Date(entry.loggedAt), "dd MMM yyyy")}
                                </p>
                                {entry.note && <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{entry.note}</p>}
                            </div>
                            {canDeleteEntry(entry) && (
                                <button type="button" onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950" title="Delete time entry">
                                    <Trash2Icon className="size-4 text-red-600 dark:text-red-400" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskTimeTracking;
