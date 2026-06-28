import { CalendarDaysIcon, Plus, ShieldCheckIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import StatsGrid from '../components/StatsGrid'
import ProjectOverview from '../components/ProjectOverview'
import RecentActivity from '../components/RecentActivity'
import TasksSummary from '../components/TasksSummary'
import CreateProjectDialog from '../components/CreateProjectDialog'
import { useUser} from '@clerk/clerk-react'
import { useSelector } from 'react-redux'

const Dashboard = () => {

    const {user} = useUser()
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })

    return (
        <div className='space-y-8'>
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-7">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_82%_15%,rgba(20,184,166,0.14),transparent_24%),radial-gradient(circle_at_8%_80%,rgba(245,158,11,0.11),transparent_28%)]" />
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-zinc-800 dark:bg-zinc-900">
                                <CalendarDaysIcon className="size-3.5" /> {today}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200">
                                <ShieldCheckIcon className="size-3.5" /> {currentWorkspace?.members?.length || 0} workspace members
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950 dark:text-white mb-2"> Welcome back, {user?.firstName || user?.fullName || 'User'} </h1>
                        <p className="max-w-2xl text-slate-500 dark:text-zinc-400 text-sm sm:text-base"> Here is your professional delivery view for {currentWorkspace?.name || "this workspace"}: projects, risks, assignments, and upcoming work in one place. </p>
                </div>

                    <button onClick={() => setIsDialogOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition" >
                        <SparklesIcon size={15} />
                    <Plus size={16} /> New Project
                </button>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                </div>
            </div>

            <StatsGrid />

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview />
                    <RecentActivity />
                </div>
                <div>
                    <TasksSummary />
                </div>
            </div>
        </div>
    )
}

export default Dashboard
