import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FilterIcon, FolderOpen, Plus, Search } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import CreateProjectDialog from "../components/CreateProjectDialog";

export default function Projects() {
    
    const projects = useSelector(
        (state) => state?.workspace?.currentWorkspace?.projects || []
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: "ALL",
        priority: "ALL",
    });

    const filteredProjects = useMemo(() => {
        let filtered = projects;

        if (searchTerm) {
            filtered = filtered.filter(
                (project) =>
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.status !== "ALL") {
            filtered = filtered.filter((project) => project.status === filters.status);
        }

        if (filters.priority !== "ALL") {
            filtered = filtered.filter(
                (project) => project.priority === filters.priority
            );
        }

        return filtered;
    }, [projects, searchTerm, filters]);

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950 dark:text-white mb-1"> Projects </h1>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm"> Manage delivery, priority, ownership, and roadmap progress. </p>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="inline-flex items-center px-5 py-2.5 text-sm rounded-lg bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition" >
                    <Plus className="size-4 mr-2" /> New Project
                </button>
                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-col md:flex-row gap-3">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-zinc-500 w-4 h-4" />
                    <input onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} className="w-full pl-10 text-sm pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" placeholder="Search projects..." />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                    <FilterIcon className="size-4" />
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white text-sm" >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PLANNING">Planning</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white text-sm" >
                    <option value="ALL">All Priority</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    </select>
                </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white text-center py-16 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-10 h-10 text-slate-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            No projects found
                        </h3>
                        <p className="text-slate-500 dark:text-zinc-400 mb-6 text-sm">
                            Create your first project to get started
                        </p>
                        <button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg mx-auto text-sm" >
                            <Plus className="size-4" />
                            Create Project
                        </button>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))
                )}
            </div>
        </div>
    );
}
