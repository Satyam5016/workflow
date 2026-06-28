import { useState } from "react";
import { Calendar as CalendarIcon, CheckCircle2Icon, ClipboardListIcon, FlagIcon, TimerIcon, UserRoundIcon, XIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";
import toast from "react-hot-toast";
import { addTask } from "../features/workspaceSlice";

export default function CreateTaskDialog({ showCreateTask, setShowCreateTask, projectId }) {

    const {getToken} = useAuth();
    const dispatch = useDispatch();

    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const project = currentWorkspace?.projects.find((p) => p.id === projectId);
    const teamMembers = project?.members || [];
    const milestones = project?.milestones || [];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        due_date: "",
        milestoneId: "",
        estimated_hours: 0,
        dependencyIds: [],
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Simulate API call to create task
            const {data} = await api.post('/api/tasks/', {...formData, workspaceId: currentWorkspace.id, projectId}, {
                headers: {
                    Authorization: `Bearer ${await getToken()}`,
                },
            });
            setShowCreateTask(false);
            setFormData({
                title: "",
                description: "",
                type: "TASK",
                status: "TODO",
                priority: "MEDIUM",
                assigneeId: "",
                due_date: "",
                milestoneId: "",
                estimated_hours: 0,
                dependencyIds: [],
            });
            toast.success(data.message);
            dispatch(addTask(data.task));
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }

    };

    return showCreateTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 dark:bg-black/70 backdrop-blur-sm p-4 animate-rise-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xl shadow-slate-950/20 w-full max-w-2xl max-h-[92vh] overflow-hidden text-slate-900 dark:text-white relative">
                <button type="button" onClick={() => setShowCreateTask(false)} className="absolute right-4 top-4 size-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100" title="Close">
                    <XIcon className="size-5" />
                </button>
                <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-6 pr-14">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-lg bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                            <ClipboardListIcon className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Create New Task</h2>
                            <p className="text-sm text-slate-500 dark:text-zinc-400">{project?.name || "Project task"} delivery item</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto max-h-[calc(92vh-6.5rem)] p-6">
                    {/* Title */}
                    <div className="space-y-1">
                        <label htmlFor="title" className="text-sm font-medium">Title</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Design payment settings screen" className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" required />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Acceptance criteria, context, links, or notes" className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                    </div>

                    {/* Type & Priority */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                                <option value="BUG">Bug</option>
                                <option value="FEATURE">Feature</option>
                                <option value="TASK">Task</option>
                                <option value="IMPROVEMENT">Improvement</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><FlagIcon className="size-4 text-slate-400" /> Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"                             >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignee and Status */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><UserRoundIcon className="size-4 text-slate-400" /> Assignee</label>
                            <select value={formData.assigneeId} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                                <option value="">Unassigned</option>
                                {teamMembers.map((member) => (
                                    <option key={member?.user.id} value={member?.user.id}>
                                        {member?.user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium flex items-center gap-2"><CheckCircle2Icon className="size-4 text-slate-400" /> Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Due Date</label>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-5 text-slate-400 dark:text-zinc-400" />
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                        </div>
                        {formData.due_date && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {format(new Date(formData.due_date), "PPP")}
                            </p>
                        )}
                    </div>

                    {/* Milestone */}
                    <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Milestone</label>
                        <select value={formData.milestoneId} onChange={(e) => setFormData({ ...formData, milestoneId: e.target.value })} className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500">
                            <option value="">No milestone</option>
                            {milestones.map((milestone) => (
                                <option key={milestone.id} value={milestone.id}>{milestone.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estimate */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium flex items-center gap-2"><TimerIcon className="size-4 text-slate-400" /> Estimated Hours</label>
                        <input type="number" min="0" step="0.25" value={formData.estimated_hours} onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })} placeholder="0" className="w-full rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2.5 text-slate-900 dark:text-zinc-100 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                    </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Dependencies</label>
                        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                            {(project?.tasks || []).length === 0 ? (
                                <p className="p-3 text-sm text-slate-500 dark:text-zinc-400">No existing tasks to depend on yet.</p>
                            ) : (
                                (project?.tasks || []).map((task) => (
                                    <label key={task.id} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm text-slate-900 dark:text-zinc-100">{task.title}</span>
                                            <span className="text-xs text-slate-500 dark:text-zinc-400">{task.status.replace("_", " ")}</span>
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={formData.dependencyIds.includes(task.id)}
                                            onChange={() => setFormData((prev) => ({
                                                ...prev,
                                                dependencyIds: prev.dependencyIds.includes(task.id)
                                                    ? prev.dependencyIds.filter((id) => id !== task.id)
                                                    : [...prev.dependencyIds, task.id],
                                            }))}
                                        />
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-3 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 p-4 backdrop-blur">
                        <button type="button" onClick={() => setShowCreateTask(false)} className="rounded-lg border border-slate-200 dark:border-zinc-800 px-5 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-zinc-900 transition" >
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="rounded-lg px-5 py-2.5 text-sm bg-teal-600 hover:bg-teal-700 text-white transition disabled:opacity-50 shadow-lg shadow-teal-600/20" >
                            {isSubmitting ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;
}
