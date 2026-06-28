import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { ArrowRightIcon, BadgeCheckIcon, CalendarClockIcon, KanbanIcon, Loader2Icon, ShieldCheckIcon, SparklesIcon } from 'lucide-react'
import {
    useUser,
    SignIn,
    useAuth,
    CreateOrganization,
    useOrganizationList,
} from '@clerk/clerk-react'
import { fetchWorkspaces } from '../features/workspaceSlice'
import { assets } from '../assets/assets'

const FullscreenLoader = ({ label }) => (
    <div className='flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-zinc-950 gap-3'>
        <img src={assets.workflow_logo} alt="Workflow" className="size-14 rounded-2xl shadow-lg animate-soft-float" />
        <Loader2Icon className="size-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
        {label && <p className="text-sm text-slate-500 dark:text-zinc-400">{label}</p>}
    </div>
)

const AuthLanding = () => {
    const featureCards = [
        { icon: KanbanIcon, label: "Kanban, tasks, subtasks" },
        { icon: CalendarClockIcon, label: "Milestones and reminders" },
        { icon: ShieldCheckIcon, label: "Admin and member permissions" },
    ]

    return (
        <main className="min-h-screen overflow-hidden bg-[#f7faf9] text-slate-950 dark:bg-zinc-950 dark:text-white">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(13,148,136,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.13),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(236,253,245,0.54))] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.12),transparent_24%),linear-gradient(135deg,rgba(24,24,27,0.95),rgba(9,9,11,0.98))]" />
                <div className="absolute left-1/2 top-24 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full border border-teal-200/60 dark:border-teal-500/10 blur-sm" />
            </div>

            <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
                <div className="flex items-center gap-3">
                    <img src={assets.workflow_logo} alt="Workflow logo" className="size-11 rounded-xl shadow-md" />
                    <div>
                        <p className="text-base font-semibold tracking-tight">Workflow</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Project command center</p>
                    </div>
                </div>
                <div className="hidden items-center gap-2 text-sm text-slate-600 dark:text-zinc-300 sm:flex">
                    <BadgeCheckIcon className="size-4 text-teal-600 dark:text-teal-400" />
                    Secure Clerk authentication
                </div>
            </nav>

            <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5.25rem)] max-w-7xl items-center gap-10 px-6 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:px-8">
                <div className="max-w-3xl animate-rise-in">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-medium text-teal-800 shadow-sm backdrop-blur dark:border-teal-500/20 dark:bg-zinc-900/70 dark:text-teal-200">
                        <SparklesIcon className="size-3.5" />
                        Plan, assign, track, and ship from one workspace
                    </div>
                    <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                        Professional project management for teams that need clarity every day.
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
                        Manage projects, roadmap milestones, tasks, files, comments, notifications, time logs, and role-based access without losing the thread.
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {featureCards.map((item) => (
                            <div key={item.label} className="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
                                <item.icon className="mb-3 size-5 text-teal-600 dark:text-teal-400" />
                                <p className="text-sm font-medium text-slate-800 dark:text-zinc-100">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 overflow-hidden rounded-lg border border-slate-200/80 bg-white/80 shadow-2xl shadow-teal-900/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
                        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-red-400" />
                                <span className="size-2.5 rounded-full bg-amber-400" />
                                <span className="size-2.5 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-xs text-slate-500 dark:text-zinc-400">Live delivery overview</span>
                        </div>
                        <div className="grid gap-4 p-4 md:grid-cols-3">
                            {["MVP", "Beta", "Launch"].map((stage, index) => (
                                <div key={stage} className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm font-semibold">{stage}</p>
                                        <span className="text-xs text-teal-700 dark:text-teal-300">{[72, 45, 18][index]}%</span>
                                    </div>
                                    <div className="space-y-2">
                                        {[0, 1, 2].map((item) => (
                                            <div key={item} className="h-10 rounded bg-white shadow-sm dark:bg-zinc-900" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="animate-rise-in rounded-lg border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 lg:justify-self-end">
                    <div className="mb-4 flex items-center justify-between px-1">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Welcome to Workflow</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">Sign in to continue</p>
                        </div>
                        <ArrowRightIcon className="size-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <SignIn
                        routing="hash"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                cardBox: "shadow-none w-full",
                                card: "shadow-none border-0 bg-transparent p-0",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "rounded-md",
                                formButtonPrimary: "bg-teal-600 hover:bg-teal-700 text-white rounded-md",
                                footerActionLink: "text-teal-700 hover:text-teal-800 dark:text-teal-300",
                            },
                        }}
                    />
                </aside>
            </section>
        </main>
    )
}

// Rendered only after the user is signed in, so it's safe to call useOrganizationList.
const AuthedLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const dispatch = useDispatch()
    const { getToken } = useAuth()
    const { loading, workspaces } = useSelector((state) => state.workspace)
    const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({
        userMemberships: true,
    })

    const clerkOrgCount = userMemberships?.data?.length ?? 0

    useEffect(() => {
        if (!orgsLoaded) return
        if (clerkOrgCount === 0) return
        if (workspaces.length > 0) return
        dispatch(fetchWorkspaces({ getToken, expectWorkspace: true }))
    }, [dispatch, getToken, orgsLoaded, clerkOrgCount, workspaces.length])

    if (!orgsLoaded) {
        return <FullscreenLoader />
    }

    if (clerkOrgCount === 0) {
        return (
            <div className='flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950'>
                <CreateOrganization
                    routing="hash"
                    afterCreateOrganizationUrl="/"
                    skipInvitationScreen
                />
            </div>
        )
    }

    if (loading || workspaces.length === 0) {
        return <FullscreenLoader label="Setting up your workspace…" />
    }

    return (
        <div className="flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:py-8">
                    <Outlet />
                    </div>
                </div>
            </div>
        </div>
    )
}

const Layout = () => {
    const dispatch = useDispatch()
    const { user, isLoaded } = useUser()

    useEffect(() => {
        dispatch(loadTheme())
    }, [dispatch])

    if (!isLoaded) {
        return <FullscreenLoader />
    }

    if (!user) {
        return <AuthLanding />
    }

    return <AuthedLayout />
}

export default Layout
