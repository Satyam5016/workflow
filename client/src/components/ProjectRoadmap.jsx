import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CalendarDaysIcon, CheckCircle2Icon, MilestoneIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch } from "react-redux";
import { fetchWorkspaces } from "../features/workspaceSlice";
import api from "../configs/api";

const emptyForm = {
    name: "",
    description: "",
    due_date: "",
};

const getMilestoneProgress = (tasks = []) => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100);
};

const ProjectRoadmap = ({ project }) => {
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const [milestones, setMilestones] = useState(project?.milestones || []);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState("");
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const unassignedTasks = useMemo(() => {
        return (project?.tasks || []).filter((task) => !task.milestoneId);
    }, [project?.tasks]);

    const fetchMilestones = useCallback(async () => {
        if (!project?.id) return;

        try {
            const token = await getToken();
            const { data } = await api.get(`/api/milestones/project/${project.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMilestones(data.milestones || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [getToken, project?.id]);

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            const token = await getToken();
            const payload = {
                ...formData,
                projectId: project.id,
                due_date: formData.due_date || null,
            };
            const request = editingId
                ? api.put(`/api/milestones/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } })
                : api.post("/api/milestones", payload, { headers: { Authorization: `Bearer ${token}` } });

            const { data } = await request;
            if (editingId) {
                setMilestones((prev) => prev.map((milestone) => milestone.id === editingId ? data.milestone : milestone));
            } else {
                setMilestones((prev) => [...prev, data.milestone].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)));
            }
            await dispatch(fetchWorkspaces({ getToken }));
            toast.success(data.message);
            resetForm();
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (milestone) => {
        setEditingId(milestone.id);
        setFormData({
            name: milestone.name,
            description: milestone.description || "",
            due_date: milestone.due_date ? format(new Date(milestone.due_date), "yyyy-MM-dd") : "",
        });
    };

    const handleDelete = async (milestoneId) => {
        const confirmed = window.confirm("Delete this milestone? Tasks will remain in the project without a milestone.");
        if (!confirmed) return;

        setDeletingId(milestoneId);
        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/milestones/${milestoneId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMilestones((prev) => prev.filter((milestone) => milestone.id !== milestoneId));
            await dispatch(fetchWorkspaces({ getToken }));
            toast.success(data.message);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setDeletingId("");
        }
    };

    useEffect(() => {
        setMilestones(project?.milestones || []);
    }, [project?.milestones]);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    return (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
            <div className="space-y-4">
                {milestones.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 p-10 text-center">
                        <MilestoneIcon className="size-10 mx-auto mb-3 text-zinc-400" />
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">No milestones yet.</p>
                    </div>
                ) : (
                    milestones.map((milestone) => {
                        const progress = getMilestoneProgress(milestone.tasks);
                        return (
                            <section key={milestone.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                <MilestoneIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                                {milestone.name}
                                            </h2>
                                            {milestone.description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{milestone.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {milestone.due_date && (
                                                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <CalendarDaysIcon className="size-3.5" />
                                                    {format(new Date(milestone.due_date), "dd MMM yyyy")}
                                                </span>
                                            )}
                                            <button type="button" onClick={() => startEdit(milestone)} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit milestone">
                                                <SaveIcon className="size-4 text-zinc-600 dark:text-zinc-300" />
                                            </button>
                                            <button type="button" onClick={() => handleDelete(milestone.id)} disabled={deletingId === milestone.id} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950" title="Delete milestone">
                                                <Trash2Icon className="size-4 text-red-600 dark:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="h-2 flex-1 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{progress}%</span>
                                    </div>
                                </div>

                                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {(milestone.tasks || []).length === 0 ? (
                                        <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No tasks linked to this milestone.</p>
                                    ) : (
                                        milestone.tasks.map((task) => (
                                            <div key={task.id} className="p-4 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{task.assignee?.name || "Unassigned"} · {task.status.replace("_", " ")}</p>
                                                </div>
                                                {task.status === "DONE" && <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        );
                    })
                )}

                {unassignedTasks.length > 0 && (
                    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Unassigned Tasks</h2>
                        </div>
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {unassignedTasks.map((task) => (
                                <div key={task.id} className="p-4 text-sm text-zinc-700 dark:text-zinc-300">{task.title}</div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <form onSubmit={handleSubmit} className="h-fit rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{editingId ? "Edit Milestone" : "New Milestone"}</h2>
                <div>
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Name</label>
                    <input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="MVP, Beta, Launch" className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Description</label>
                    <textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} rows={3} className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">Due Date</label>
                    <input type="date" value={formData.due_date} onChange={(event) => setFormData({ ...formData, due_date: event.target.value })} className="mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-2">
                    {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700">Cancel</button>}
                    <button type="submit" disabled={saving || !formData.name.trim()} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50">
                        <PlusIcon className="size-4" /> {saving ? "Saving..." : editingId ? "Save" : "Create"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectRoadmap;
