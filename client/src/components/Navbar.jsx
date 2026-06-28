import { SearchIcon, PanelLeft, CommandIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import NotificationsCenter from './NotificationsCenter'
import { assets } from '../assets/assets'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const { theme } = useSelector(state => state.theme);
    const currentWorkspace = useSelector((state) => state.workspace.currentWorkspace);

    return (
        <div className="w-full border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6 lg:px-8 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="sm:hidden p-2 rounded-lg transition-colors text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800" title="Open navigation">
                        <PanelLeft size={20} />
                    </button>

                    <div className="hidden items-center gap-3 min-w-0 md:flex">
                        <img src={assets.workflow_logo} alt="Workflow" className="size-9 rounded-xl shadow-sm lg:hidden" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentWorkspace?.name || "Workspace"}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">Delivery command center</p>
                        </div>
                    </div>

                    <div className="relative flex-1 max-w-xl">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 size-4" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-9 pr-12 py-2.5 w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 sm:flex">
                            <CommandIcon className="size-3" /> K
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => dispatch(toggleTheme())} className="size-9 flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-lg transition hover:-translate-y-0.5 active:translate-y-0" title="Toggle theme">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-slate-700 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    <NotificationsCenter />

                    <UserButton/>
                </div>
            </div>
        </div>
    )
}

export default Navbar
