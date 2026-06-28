import { format } from "date-fns";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTask, updateTask } from "../features/workspaceSlice";
import { Bug, CalendarIcon, FilterIcon, GitBranchIcon, GitCommit, MessageSquare, Square, Trash, UserRoundIcon, XIcon, Zap } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

const getLoggedHours = (task) => {
    return (task.timeEntries || []).reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
};

const ProjectTasks = ({ tasks }) => {
    const {getToken} = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedTasks, setSelectedTasks] = useState([]);

    const [filters, setFilters] = useState({
        status: "",
        type: "",
        priority: "",
        assignee: "",
    });

    const assigneeList = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
        [tasks]
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const { status, type, priority, assignee } = filters;
            return (
                (!status || task.status === status) &&
                (!type || task.type === type) &&
                (!priority || task.priority === priority) &&
                (!assignee || task.assignee?.name === assignee)
            );
        });
    }, [filters, tasks]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            toast.loading("Updating status...");
            const token = await getToken();

            await api.put(`/api/tasks/${taskId}`, { status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            dispatch(updateTask(updatedTask));

            toast.dismissAll();
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleDelete = async () => {
        try {
            const confirm = window.confirm("Are you sure you want to delete the selected tasks?");
            if (!confirm) return;
            const token = await getToken();

            toast.loading("Deleting tasks...");

            await api.post('/api/tasks/delete', { taskIds: selectedTasks }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            dispatch(deleteTask(selectedTasks));

            toast.dismissAll();
            toast.success("Tasks deleted successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                    <FilterIcon className="size-4" />
                    Filters
                </div>
                {["status", "type", "priority", "assignee"].map((name) => {
                    const options = {
                        status: [
                            { label: "All Statuses", value: "" },
                            { label: "To Do", value: "TODO" },
                            { label: "In Progress", value: "IN_PROGRESS" },
                            { label: "Done", value: "DONE" },
                        ],
                        type: [
                            { label: "All Types", value: "" },
                            { label: "Task", value: "TASK" },
                            { label: "Bug", value: "BUG" },
                            { label: "Feature", value: "FEATURE" },
                            { label: "Improvement", value: "IMPROVEMENT" },
                            { label: "Other", value: "OTHER" },
                        ],
                        priority: [
                            { label: "All Priorities", value: "" },
                            { label: "Low", value: "LOW" },
                            { label: "Medium", value: "MEDIUM" },
                            { label: "High", value: "HIGH" },
                        ],
                        assignee: [
                            { label: "All Assignees", value: "" },
                            ...assigneeList.map((n) => ({ label: n, value: n })),
                        ],
                    };
                    return (
                        <select key={name} name={name} value={filters[name]} onChange={handleFilterChange} className="border bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 outline-none px-3 py-2 rounded-lg text-sm text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                            {options[name].map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    );
                })}

                {/* Reset filters */}
                {(filters.status || filters.type || filters.priority || filters.assignee) && (
                    <button type="button" onClick={() => setFilters({ status: "", type: "", priority: "", assignee: "" })} className="px-3 py-2 flex items-center gap-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200 text-sm transition-colors" >
                        <XIcon className="size-3" /> Reset
                    </button>
                )}

                {selectedTasks.length > 0 && (
                    <button type="button" onClick={handleDelete} className="px-3 py-2 flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors" >
                        <Trash className="size-3" /> Delete
                    </button>
                )}
            </div>
            </div>

            <div className="overflow-auto rounded-lg lg:border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                <div className="w-full">
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-slate-900 dark:text-zinc-300">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 ">
                                <tr>
                                    <th className="pl-2 pr-1">
                                        <input onChange={() => selectedTasks.length > 1 ? setSelectedTasks([]) : setSelectedTasks(tasks.map((t) => t.id))} checked={selectedTasks.length === tasks.length} type="checkbox" className="size-3 accent-zinc-600 dark:accent-zinc-500" />
                                    </th>
                                    <th className="px-4 pl-0 py-3">Title</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Milestone</th>
                                    <th className="px-4 py-3">Dependencies</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Assignee</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.map((task) => {
                                        const { icon: Icon, color } = typeIcons[task.type] || {};
                                        const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                        return (
                                            <tr key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className="border-t border-slate-200 dark:border-zinc-800 group hover:bg-teal-50/40 dark:hover:bg-zinc-900 transition-all cursor-pointer" >
                                                <td onClick={e => e.stopPropagation()} className="pl-2 pr-1">
                                                    <input type="checkbox" className="size-3 accent-zinc-600 dark:accent-zinc-500" onChange={() => selectedTasks.includes(task.id) ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id)) : setSelectedTasks((prev) => [...prev, task.id])} checked={selectedTasks.includes(task.id)} />
                                                </td>
                                                <td className="px-4 pl-0 py-3 font-medium text-slate-900 dark:text-zinc-100">{task.title}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {Icon && <Icon className={`size-4 ${color}`} />}
                                                        <span className={`uppercase text-xs ${color}`}>{task.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                                                    {task.milestone?.name || "-"}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {(task.dependsOn || []).length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                            <GitBranchIcon className="size-3" /> {task.dependsOn.length}
                                                        </span>
                                                    ) : "-"}
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-2">
                                                    <select name="status" onChange={(e) => handleStatusChange(task.id, e.target.value)} value={task.status} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 outline-none px-2 pr-4 py-1 rounded-md text-sm text-slate-900 dark:text-zinc-200 cursor-pointer focus:ring-2 focus:ring-teal-500/25" >
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="DONE">Done</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {task.assignee?.image ? <img src={task.assignee.image} className="size-5 rounded-full" alt="avatar" /> : <UserRoundIcon className="size-4 text-slate-400" />}
                                                        {task.assignee?.name || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                                                    {getLoggedHours(task).toFixed(1)}h / {Number(task.estimated_hours || 0).toFixed(1)}h
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                                        <CalendarIcon className="size-4" />
                                                        {format(new Date(task.due_date), "dd MMMM")}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center text-zinc-500 dark:text-zinc-400 py-6">
                                            No tasks found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden flex flex-col gap-4 p-3 bg-slate-50 dark:bg-zinc-950">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const { icon: Icon, color } = typeIcons[task.type] || {};
                                const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                return (
                                    <div key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:border-teal-200 dark:hover:border-teal-500/30 transition">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-slate-900 dark:text-zinc-100 text-sm font-semibold">{task.title}</h3>
                                            <input onClick={(e) => e.stopPropagation()} type="checkbox" className="size-4 accent-teal-600" onChange={() => selectedTasks.includes(task.id) ? setSelectedTasks(selectedTasks.filter((i) => i !== task.id)) : setSelectedTasks((prev) => [...prev, task.id])} checked={selectedTasks.includes(task.id)} />
                                        </div>

                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                            {Icon && <Icon className={`size-4 ${color}`} />}
                                            <span className={`${color} uppercase`}>{task.type}</span>
                                        </div>

                                        <div>
                                            <span className={`text-xs px-2 py-1 rounded ${background} ${prioritycolor}`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        {task.milestone && (
                                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                                Milestone: {task.milestone.name}
                                            </div>
                                        )}

                                        {(task.dependsOn || []).length > 0 && (
                                            <div className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                <GitBranchIcon className="size-3" /> Depends on {task.dependsOn.length}
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-zinc-600 dark:text-zinc-400 text-xs">Status</label>
                                            <select onClick={(e) => e.stopPropagation()} name="status" onChange={(e) => handleStatusChange(task.id, e.target.value)} value={task.status} className="w-full mt-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 outline-none px-2 py-2 rounded-lg text-sm text-slate-900 dark:text-zinc-200" >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {task.assignee?.image ? <img src={task.assignee.image} className="size-5 rounded-full" alt="avatar" /> : <UserRoundIcon className="size-4 text-slate-400" />}
                                            {task.assignee?.name || "-"}
                                        </div>

                                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                            Time: {getLoggedHours(task).toFixed(1)}h / {Number(task.estimated_hours || 0).toFixed(1)}h
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            <CalendarIcon className="size-4" />
                                            {format(new Date(task.due_date), "dd MMMM")}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
                                No tasks found for the selected filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTasks;
