'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  UserSquare2, 
  FileHeart, 
  FolderHeart,
  Menu,
  X,
  Link2
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patients', href: '/dashboard/patients', icon: Users },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarDays },
    { name: 'Doctors', href: '/dashboard/doctors', icon: UserSquare2 },
    { name: 'Connections', href: '/dashboard/connections', icon: Link2 },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-teal-600 text-white shadow-md hover:bg-teal-700 transition"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
            <div className="bg-teal-500 p-2 rounded-lg text-white">
              <FileHeart size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">TeleClinic</h1>
              <span className="text-xs text-teal-400 font-medium">Control Dashboard</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="bg-teal-900/60 p-2 rounded-full text-teal-400">
              <FolderHeart size={16} />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-300">WhatsApp Integrated</p>
              <p className="text-slate-500">Connected to theaibot</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay when sidebar is open in mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        />
      )}
    </>
  );
}
