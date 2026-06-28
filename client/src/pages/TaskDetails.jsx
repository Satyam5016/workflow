import { format } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, CalendarIcon, CheckCircle2Icon, MessageCircle, PaperclipIcon, PenIcon, SendIcon, TimerIcon, UserRoundIcon } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api";
import TaskAttachments from "../components/TaskAttachments";
import TaskChecklist from "../components/TaskChecklist";
import TaskTimeTracking from "../components/TaskTimeTracking";
import TaskDependencies from "../components/TaskDependencies";

const TaskDetails = () => {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const {user} =useUser();
    const {getToken} = useAuth();
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    const { currentWorkspace } = useSelector((state) => state.workspace);

    const fetchComments = useCallback(async () => {
        if(!taskId) return;

        try {
            const token = await getToken();
            const {data} = await api.get(`/api/comments/${taskId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setComments(data.comments || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    }, [getToken, taskId]);

    const fetchTaskDetails = useCallback(async () => {
        setLoading(true);
        if (!projectId || !taskId) return;
        if (!currentWorkspace?.projects) return;

        const proj = currentWorkspace.projects.find((p) => p.id === projectId);
        if (!proj) return;

        const tsk = proj.tasks.find((t) => t.id === taskId);
        if (!tsk) return;

        setTask(tsk);
        setProject(proj);
        setLoading(false);
    }, [currentWorkspace, projectId, taskId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {

            toast.loading("Adding comment...");

            const token = await getToken() ;

            const {data} = await api.post(`/api/comments`, { taskId: task.id, content: newComment }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setComments((prev) => [...prev, data.comment]);
            setNewComment("");
            toast.dismissAll();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
        }
    };

    useEffect(() => { fetchTaskDetails(); }, [fetchTaskDetails]);

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            const interval = setInterval(() => { fetchComments(); }, 10000);
            return () => clearInterval(interval);
        }
    }, [fetchComments, taskId, task]);

    if (loading) return <div className="text-slate-500 dark:text-zinc-400 px-4 py-6">Loading task details...</div>;
    if (!task) return <div className="text-red-500 px-4 py-6">Task not found.</div>;

    return (
        <div className="space-y-6 text-slate-900 dark:text-zinc-100 animate-rise-in">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <button onClick={() => navigate(`/projectsDetail?id=${projectId}&tab=tasks`)} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white">
                    <ArrowLeftIcon className="size-4" /> Back to project
                </button>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{task.title}</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-zinc-400">{task.description || "No task description has been added."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[task.status, task.type, task.priority].map((item) => (
                            <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                                {item.replace("_", " ")}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
            <div className="w-full">
                <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col lg:h-[76vh]">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => (
                                    <div key={comment.id} className={`sm:max-w-4/5 border p-3 rounded-lg shadow-sm ${comment.user.id === user?.id ? "ml-auto bg-teal-50 border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/20" : "mr-auto bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800"}`} >
                                        <div className="flex items-center gap-2 mb-1 text-sm text-slate-500 dark:text-zinc-400">
                                            <img src={comment.user.image} alt="avatar" className="size-5 rounded-full" />
                                            <span className="font-medium text-gray-900 dark:text-white">{comment.user.name}</span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-900 dark:text-zinc-200">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-zinc-500 mb-4 text-sm">No comments yet. Be the first!</p>
                        )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 border-t border-slate-200 dark:border-zinc-800 pt-4">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-slate-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                            rows={3}
                        />
                        <button onClick={handleAddComment} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-teal-600/20" >
                            <SendIcon className="size-4" /> Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Task + Project Info */}
            <div className="w-full flex flex-col gap-6">
                <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <div className="mb-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Task Summary</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 text-xs">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs">
                                {task.priority}
                            </span>
                            {task.milestone && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 text-xs">
                                    {task.milestone.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                            {task.assignee?.image ? <img src={task.assignee.image} className="size-6 rounded-full" alt="avatar" /> : <UserRoundIcon className="size-4 text-slate-400" />}
                            {task.assignee?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-slate-400 dark:text-zinc-500" />
                            Due : {format(new Date(task.due_date), "dd MMM yyyy")}
                        </div>
                        <div className="flex items-center gap-2">
                            <TimerIcon className="size-4 text-slate-400 dark:text-zinc-500" />
                            Estimate : {task.estimated_hours || 0}h
                        </div>
                        <div className="flex items-center gap-2">
                            <PaperclipIcon className="size-4 text-slate-400 dark:text-zinc-500" />
                            Attachments and supporting work below
                        </div>
                    </div>
                </div>

                <TaskChecklist task={task} />

                <TaskDependencies task={task} project={project} />

                <TaskTimeTracking task={task} project={project} />

                <TaskAttachments task={task} project={project} />

                {/* Project Info */}
                {project && (
                    <div className="p-5 rounded-lg bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <p className="text-base font-semibold mb-4 text-slate-900 dark:text-white">Project Details</p>
                        <h2 className="text-slate-900 dark:text-zinc-100 flex items-center gap-2"> <PenIcon className="size-4 text-teal-600 dark:text-teal-300" /> {project.name}</h2>
                        {project.start_date && <p className="text-xs mt-3">Project Start Date: {format(new Date(project.start_date), "dd MMM yyyy")}</p>}
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-zinc-400 mt-3">
                            <span>Status: {project.status}</span>
                            <span>Priority: {project.priority}</span>
                            <span>Progress: {project.progress}%</span>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                            <div className="h-full rounded-full bg-teal-500" style={{ width: `${project.progress || 0}%` }} />
                        </div>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default TaskDetails;
