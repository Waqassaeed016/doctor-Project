import { db } from '@/db';
import { patients, appointments, doctors, medicalFiles } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { 
  Users, 
  CalendarCheck2, 
  UserSquare2, 
  FileText, 
  ArrowRight,
  PlusCircle,
  FileClock
} from 'lucide-react';
import Link from 'next/link';

// Fallback Mock Data for UI demonstration when database is empty or unmigrated
const mockPatients = [
  { id: '1', name: 'Waqas Khan', phone: '923001234567', age: 28, gender: 'Male', createdAt: new Date() },
  { id: '2', name: 'Sarah Ahmed', phone: '923009876543', age: 34, gender: 'Female', createdAt: new Date(Date.now() - 3600000) },
  { id: '3', name: 'Muhammad Ali', phone: '923214567890', age: 45, gender: 'Male', createdAt: new Date(Date.now() - 7200000) }
];

const mockAppointments = [
  { id: '1', patientName: 'Waqas Khan', phone: '923001234567', symptoms: 'High fever and headache', status: 'pending', time: new Date() },
  { id: '2', patientName: 'Sarah Ahmed', phone: '923009876543', symptoms: 'Severe back pain', status: 'approved', time: new Date() }
];

async function getStats() {
  try {
    const totalPatientsRes = await db.select({ value: count(patients.id) }).from(patients);
    const pendingAppsRes = await db.select({ value: count(appointments.id) }).from(appointments).where(eq(appointments.status, 'pending'));
    const totalDoctorsRes = await db.select({ value: count(doctors.id) }).from(doctors);
    const totalFilesRes = await db.select({ value: count(medicalFiles.id) }).from(medicalFiles);

    const dbPatients = await db.select().from(patients).orderBy(desc(patients.createdAt)).limit(5);
    const dbAppointments = await db.select({
      id: appointments.id,
      patientName: patients.name,
      phone: patients.phone,
      symptoms: appointments.symptoms,
      status: appointments.status,
      time: appointments.appointmentTime
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .orderBy(desc(appointments.createdAt))
    .limit(5);

    return {
      totalPatients: totalPatientsRes[0]?.value || 0,
      pendingAppointments: pendingAppsRes[0]?.value || 0,
      totalDoctors: totalDoctorsRes[0]?.value || 0,
      totalFiles: totalFilesRes[0]?.value || 0,
      recentPatients: dbPatients.length > 0 ? dbPatients : null,
      recentAppointments: dbAppointments.length > 0 ? dbAppointments : null,
      isDemo: false
    };
  } catch (error) {
    console.warn("Using fallback mock data for dashboard overview due to database empty/connection issue:", error);
    return {
      totalPatients: mockPatients.length,
      pendingAppointments: mockAppointments.filter(a => a.status === 'pending').length,
      totalDoctors: 2,
      totalFiles: 4,
      recentPatients: mockPatients,
      recentAppointments: mockAppointments,
      isDemo: true
    };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { name: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400' },
    { name: 'Pending Appointments', value: stats.pendingAppointments, icon: CalendarCheck2, color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400' },
    { name: 'Active Doctors', value: stats.totalDoctors, icon: UserSquare2, color: 'from-teal-500/10 to-emerald-500/10 border-teal-500/20 text-teal-400' },
    { name: 'Drive Uploaded Reports', value: stats.totalFiles, icon: FileText, color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Tele-Clinic Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Real-time sync with patient data and WhatsApp automations.</p>
        </div>

        {stats.isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Running in Demo Fallback Mode
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className={`p-6 rounded-xl border bg-gradient-to-br ${card.color} flex items-center justify-between transition hover:-translate-y-1`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.name}</p>
                <h3 className="text-3xl font-black text-white mt-2">{card.value}</h3>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Layout for details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Recent Registrations */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileClock size={18} className="text-teal-400" />
                Recent WhatsApp Signups
              </h3>
              <Link href="/dashboard/patients" className="text-teal-400 hover:text-teal-300 text-xs font-semibold flex items-center gap-1 hover:underline">
                View all Patients <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-800 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Age/Gender</th>
                    <th className="pb-3 font-semibold">Registered</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {stats.recentPatients?.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 font-semibold text-white">{patient.name}</td>
                      <td className="py-3.5 text-slate-400 font-mono">{patient.phone}</td>
                      <td className="py-3.5">
                        {patient.age || 'N/A'} yrs / {patient.gender || 'N/A'}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link 
                          href={`/dashboard/patients/${patient.id}`}
                          className="px-3 py-1 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white rounded-md text-xs font-bold transition border border-teal-500/20"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Appointment Requests */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarCheck2 size={18} className="text-amber-400" />
                Active Requests
              </h3>
              <Link href="/dashboard/appointments" className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 hover:underline">
                Manage <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {stats.recentAppointments?.map((app) => (
                <div key={app.id} className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{app.patientName}</h4>
                      <p className="text-xs text-slate-400 font-mono">{app.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      app.status === 'pending' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 border-t border-slate-800 pt-2 line-clamp-2">
                    <strong className="text-slate-300">Symptoms:</strong> {app.symptoms}
                  </p>

                  {app.status === 'pending' && (
                    <Link 
                      href="/dashboard/appointments"
                      className="mt-1.5 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-center text-xs rounded transition flex items-center justify-center gap-1"
                    >
                      <PlusCircle size={14} /> Assign Doctor & Approve
                    </Link>
                  )}
                </div>
              ))}

              {stats.recentAppointments?.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-6">No pending appointment requests.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
