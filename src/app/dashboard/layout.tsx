import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Header (Top Navigation) */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Empty space for mobile sidebar trigger */}
            <div className="w-10 lg:hidden" />
            <h2 className="text-sm font-semibold text-slate-300">TeleClinic Systems</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              WhatsApp Bot Active
            </span>
          </div>
        </header>

        {/* Dynamic Pages Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
