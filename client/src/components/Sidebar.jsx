import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { assets } from '../assets/assets'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {

    const {openUserProfile} = useClerk();

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <div ref={sidebarRef} className={`z-30 bg-white dark:bg-zinc-950 min-w-72 flex flex-col h-screen border-r border-slate-200 dark:border-zinc-800 max-sm:fixed max-sm:top-0 transition-all duration-300 ${isSidebarOpen ? 'left-0 shadow-2xl' : '-left-full'} `} >
            <div className="flex items-center gap-3 px-5 py-4">
                <img src={assets.workflow_logo} alt="Workflow logo" className="size-11 rounded-xl shadow-md" />
                <div>
                    <p className="font-semibold text-slate-950 dark:text-white">Workflow</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Project OS</p>
                </div>
            </div>
            <WorkspaceDropdown />
            <hr className='border-slate-200 dark:border-zinc-800' />
            <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                <div>
                    <div className='p-4'>
                        {menuItems.map((item) => (
                            <NavLink to={item.href} key={item.name} className={({ isActive }) => `flex items-center gap-3 py-2.5 px-4 text-slate-700 dark:text-zinc-100 cursor-pointer rounded-lg transition-all ${isActive ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-200 dark:ring-teal-500/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900'}`} >
                                <item.icon size={16} />
                                <p className='text-sm truncate'>{item.name}</p>
                            </NavLink>
                        ))}
                        <button onClick={openUserProfile} className='flex w-full items-center gap-3 py-2.5 px-4 text-slate-700 dark:text-zinc-100 cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all'>
                            <SettingsIcon size={16} />
                            <p className='text-sm truncate'>Settings</p>
                        </button>
                    </div>
                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>


            </div>

        </div>
    )
}

export default Sidebar
