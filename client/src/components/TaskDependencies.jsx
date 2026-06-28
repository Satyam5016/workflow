import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { GitBranchIcon, LinkIcon, SaveIcon, XIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../configs/api";
import { updateTask } from "../features/workspaceSlice";

const TaskDependencies = ({ task, project }) => {
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const currentProject = useSelector((state) => {
        const projects = state.workspace?.currentWorkspace?.projects || [];
        return projects.find((item) => item.id === project?.id) || project;
    });
    const [dependencyIds, setDependencyIds] = useState((task.dependsOn || []).map((item) => item.id));
    const [saving, setSaving] = useState(false);

    const availableTasks = useMemo(() => {
        return (currentProject?.tasks || []).filter((item) => item.id !== task.id);
    }, [currentProject?.tasks, task.id]);

    const blockers = dependencyIds
        .map((id) => availableTasks.find((item) => item.id === id) || (task.dependsOn || []).find((item) => item.id === id))
        .filter(Boolean);

    const toggleDependency = (id) => {
        setDependencyIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
    };

    const saveDependencies = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const { data } = await api.put(`/api/tasks/${task.id}`, { dependencyIds }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            dispatch(updateTask(data.task));
            toast.success("Dependencies updated");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <GitBranchIcon className="size-4 text-teal-600 dark:text-teal-300" />
                        Dependencies
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Tasks that must finish before this one can safely move forward.</p>
                </div>
                <button onClick={saveDependencies} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700 disabled:opacity-50">
                    <SaveIcon className="size-4" /> {saving ? "Saving..." : "Save"}
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {blockers.length === 0 ? (
                    <span className="text-sm text-slate-500 dark:text-zinc-400">No dependencies selected.</span>
                ) : (
                    blockers.map((dependency) => (
                        <button key={dependency.id} type="button" onClick={() => toggleDependency(dependency.id)} className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs text-teal-800 hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200">
                            <LinkIcon className="size-3" /> {dependency.title}
                            <XIcon className="size-3" />
                        </button>
                    ))
                )}
            </div>

            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                {availableTasks.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 dark:text-zinc-400">Create more tasks in this project to link dependencies.</p>
                ) : (
                    availableTasks.map((candidate) => (
                        <label key={candidate.id} className="flex cursor-pointer items-center justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-900 dark:text-zinc-100">{candidate.title}</span>
                                <span className="text-xs text-slate-500 dark:text-zinc-400">{candidate.status.replace("_", " ")}</span>
                            </span>
                            <input type="checkbox" checked={dependencyIds.includes(candidate.id)} onChange={() => toggleDependency(candidate.id)} />
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskDependencies;
