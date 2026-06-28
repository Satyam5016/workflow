import { useState } from "react";
import { CalendarDaysIcon, FlagIcon, FolderPlusIcon, UserRoundIcon, UsersIcon, XIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import api from "../configs/api";
import { useAuth } from "@clerk/clerk-react";
import { addProject } from "../features/workspaceSlice";
import { toast } from "react-hot-toast";

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        team_members: [],
        team_lead: "",
        progress: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.team_lead) {
                return toast.error("Please select a team lead.")
            }
            setIsSubmitting(true);
            const data = await api.post("/api/projects/", { workspaceId: currentWorkspace.id, ...formData }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            dispatch(addProject(data.data.project));
            // toast.success("Project created successfully!");
            setIsDialogOpen(false);
        }
        catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const removeTeamMember = (email) => {
        setFormData((prev) => ({ ...prev, team_members: prev.team_members.filter(m => m !== email) }));
    };

    if (!isDialogOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/35 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center text-left z-50 p-4 animate-rise-in">
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-2xl shadow-slate-950/20 w-full max-w-2xl max-h-[92vh] overflow-hidden text-slate-900 dark:text-zinc-100 relative">
                <button className="absolute top-4 right-4 size-9 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-zinc-100" onClick={() => setIsDialogOpen(false)} title="Close">
                    <XIcon className="size-5" />
                </button>

                <div className="border-b border-slate-200 dark:border-zinc-800 p-6 pr-14 bg-slate-50/70 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-lg bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                            <FolderPlusIcon className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Create New Project</h2>
                            {currentWorkspace && (
                                <p className="text-sm text-slate-500 dark:text-zinc-400">
                                    Workspace: <span className="text-teal-700 dark:text-teal-300">{currentWorkspace.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto max-h-[calc(92vh-6.5rem)] p-6">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Project Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Website redesign, mobile app launch..." className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" required />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Goal, scope, stakeholders, or success criteria" className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><FlagIcon className="size-4 text-slate-400" /> Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><CalendarDaysIcon className="size-4 text-slate-400" /> Start Date</label>
                            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">End Date</label>
                            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} min={formData.start_date && new Date(formData.start_date).toISOString().split('T')[0]} className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" />
                        </div>
                    </div>

                    {/* Lead */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><UserRoundIcon className="size-4 text-slate-400" /> Project Lead</label>
                        <select value={formData.team_lead} onChange={(e) => setFormData({ ...formData, team_lead: e.target.value, team_members: e.target.value ? [...new Set([...formData.team_members, e.target.value])] : formData.team_members, })} className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500" >
                            <option value="">No lead</option>
                            {currentWorkspace?.members?.map((member) => (
                                <option key={member.user.email} value={member.user.email}>
                                    {member.user.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Team Members */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><UsersIcon className="size-4 text-slate-400" /> Team Members</label>
                        <select className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                            onChange={(e) => {
                                if (e.target.value && !formData.team_members.includes(e.target.value)) {
                                    setFormData((prev) => ({ ...prev, team_members: [...prev.team_members, e.target.value] }));
                                }
                            }}
                        >
                            <option value="">Add team members</option>
                            {currentWorkspace?.members
                                ?.filter((member) => !formData.team_members.includes(member.user.email))
                                .map((member) => (
                                    <option key={member.user.email} value={member.user.email}>
                                        {member.user.email}
                                    </option>
                                ))}
                        </select>

                        {formData.team_members.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.team_members.map((email) => (
                                    <div key={email} className="flex items-center gap-1 bg-teal-50 dark:bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-500/20 px-2 py-1 rounded-md text-sm" >
                                        {email}
                                        <button type="button" onClick={() => removeTeamMember(email)} className="ml-1 hover:bg-teal-100 dark:hover:bg-teal-500/20 rounded" title="Remove member">
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-3 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 p-4 text-sm backdrop-blur">
                        <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900" >
                            Cancel
                        </button>
                        <button disabled={isSubmitting || !currentWorkspace} className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 shadow-lg shadow-teal-600/20" >
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectDialog;
