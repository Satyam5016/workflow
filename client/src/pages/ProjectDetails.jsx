import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, SettingsIcon, BarChart3Icon, CalendarIcon, FileStackIcon, HistoryIcon, KanbanIcon, MilestoneIcon, CheckCircle2Icon, Clock3Icon, UsersIcon, BotIcon } from "lucide-react";
import ProjectAnalytics from "../components/ProjectAnalytics";
import ProjectSettings from "../components/ProjectSettings";
import CreateTaskDialog from "../components/CreateTaskDialog";
import ProjectCalendar from "../components/ProjectCalendar";
import ProjectTasks from "../components/ProjectTasks";
import ProjectActivity from "../components/ProjectActivity";
import ProjectKanbanBoard from "../components/ProjectKanbanBoard";
import ProjectRoadmap from "../components/ProjectRoadmap";
import ProjectTimeline from "../components/ProjectTimeline";
import ProjectAssistant from "../components/ProjectAssistant";

export default function ProjectDetail() {

    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab');
    const id = searchParams.get('id');

    const navigate = useNavigate();
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [activeTab, setActiveTab] = useState(tab || "tasks");

    useEffect(() => {
        if (tab) setActiveTab(tab);
    }, [tab]);

    useEffect(() => {
        if (projects && projects.length > 0) {
            const proj = projects.find((p) => p.id === id);
            setProject(proj);
            setTasks(proj?.tasks || []);
        }
    }, [id, projects]);

    const statusColors = {
        PLANNING: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200",
        ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
        ON_HOLD: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
        COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
        CANCELLED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    };

    if (!project) {
        return (
            <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
                <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
                <button onClick={() => navigate('/projects')} className="mt-4 px-4 py-2 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600" >
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-slate-900 dark:text-white animate-rise-in">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_82%_15%,rgba(20,184,166,0.12),transparent_26%)]" />
                <div className="relative flex max-md:flex-col gap-4 flex-wrap items-start justify-between">
                <div className="flex items-start gap-4">
                    <button className="mt-1 size-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800" onClick={() => navigate('/projects')} title="Back to projects">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold tracking-normal">{project.name}</h1>
                            <span className={`px-2.5 py-1 rounded-full text-xs capitalize border border-current/10 ${statusColors[project.status]}`} >
                            {project.status.replace("_", " ")}
                        </span>
                        </div>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">{project.description || "No project description has been added yet."}</p>
                    </div>
                </div>
                <button onClick={() => setShowCreateTask(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 transition" >
                    <PlusIcon className="size-4" />
                    New Task
                </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks", value: tasks.length, color: "text-slate-950 dark:text-white", icon: FileStackIcon },
                    { label: "Completed", value: tasks.filter((t) => t.status === "DONE").length, color: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2Icon },
                    { label: "Open Work", value: tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO").length, color: "text-amber-700 dark:text-amber-400", icon: Clock3Icon },
                    { label: "Team Members", value: project.members?.length || 0, color: "text-teal-700 dark:text-teal-400", icon: UsersIcon },
                ].map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex justify-between p-4 rounded-lg shadow-sm hover:-translate-y-0.5 transition">
                        <div>
                            <div className="text-sm text-slate-500 dark:text-zinc-400">{card.label}</div>
                            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        </div>
                        <card.icon className={`size-5 ${card.color}`} />
                    </div>
                ))}
            </div>

            <div>
                <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    {[
                        { key: "tasks", label: "Tasks", icon: FileStackIcon },
                        { key: "board", label: "Board", icon: KanbanIcon },
                        { key: "roadmap", label: "Roadmap", icon: MilestoneIcon },
                        { key: "timeline", label: "Timeline", icon: CalendarIcon },
                        { key: "assistant", label: "Assistant", icon: BotIcon },
                        { key: "activity", label: "Activity", icon: HistoryIcon },
                        { key: "calendar", label: "Calendar", icon: CalendarIcon },
                        { key: "analytics", label: "Analytics", icon: BarChart3Icon },
                        { key: "settings", label: "Settings", icon: SettingsIcon },
                    ].map((tabItem) => (
                        <button key={tabItem.key} onClick={() => { setActiveTab(tabItem.key); setSearchParams({ id: id, tab: tabItem.key }) }} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${activeTab === tabItem.key ? "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200" : "text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-900"}`} >
                            <tabItem.icon className="size-3.5" />
                            {tabItem.label}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    {activeTab === "tasks" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectTasks tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "analytics" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectAnalytics tasks={tasks} project={project} />
                        </div>
                    )}
                    {activeTab === "board" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectKanbanBoard tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "activity" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectActivity project={project} />
                        </div>
                    )}
                    {activeTab === "roadmap" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectRoadmap project={project} />
                        </div>
                    )}
                    {activeTab === "timeline" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectTimeline project={project} />
                        </div>
                    )}
                    {activeTab === "assistant" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectAssistant project={project} />
                        </div>
                    )}
                    {activeTab === "calendar" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectCalendar tasks={tasks} />
                        </div>
                    )}
                    {activeTab === "settings" && (
                        <div className=" dark:bg-zinc-900/40 rounded max-w-6xl">
                            <ProjectSettings project={project} />
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showCreateTask && <CreateTaskDialog showCreateTask={showCreateTask} setShowCreateTask={setShowCreateTask} projectId={id} />}
        </div>
    );
}
