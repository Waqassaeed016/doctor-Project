import { db } from '@/db';
import { patients } from '@/db/schema';
import { desc, like, or } from 'drizzle-orm';
import { Search, UserPlus, Phone, Calendar, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

// Mock data fallbacks
const mockPatients = [
  { id: '1', name: 'Waqas Khan', phone: '923001234567', age: 28, gender: 'Male', medicalHistory: 'Hypertension history', createdAt: new Date() },
  { id: '2', name: 'Sarah Ahmed', phone: '923009876543', age: 34, gender: 'Female', medicalHistory: 'None reported', createdAt: new Date(Date.now() - 86400000) },
  { id: '3', name: 'Muhammad Ali', phone: '923214567890', age: 45, gender: 'Male', medicalHistory: 'Diabetes Type 2', createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: '4', name: 'Zainab Bibi', phone: '923335556677', age: 22, gender: 'Female', medicalHistory: 'Asthma patient', createdAt: new Date(Date.now() - 86400000 * 5) }
];

async function getPatients(query?: string) {
  try {
    let queryConditions = [];
    if (query) {
      const searchPattern = `%${query}%`;
      return await db.select()
        .from(patients)
        .where(
          or(
            like(patients.name, searchPattern),
            like(patients.phone, searchPattern)
          )
        )
        .orderBy(desc(patients.createdAt));
    }
    
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  } catch (error) {
    console.warn("Using mock patient data due to DB error:", error);
    if (query) {
      return mockPatients.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.phone.includes(query)
      );
    }
    return mockPatients;
  }
}

export default async function PatientsPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  const patientList = await getPatients(q);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Patient Directory</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage patient profiles, view history, and prescriptions.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/dashboard/patients" className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by Name or Phone Number..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition text-sm"
          />
        </form>

        <div className="text-xs text-slate-500 font-medium">
          Showing {patientList.length} patient records
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {patientList.map((patient) => (
          <div 
            key={patient.id}
            className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">{patient.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Phone size={12} className="text-slate-500" />
                    <span className="font-mono">{patient.phone}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  patient.gender === 'Male' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                }`}>
                  {patient.gender || 'Not Specified'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block">Age</span>
                  <span className="text-slate-300 font-semibold">{patient.age ? `${patient.age} years` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Joined</span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    {new Date(patient.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">Medical Background:</span>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/40">
                  {patient.medicalHistory || 'No historical background declared.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href={`/dashboard/patients/${patient.id}`}
                className="w-full py-2 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white border border-teal-500/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                View Patient Profile <ArrowRightLeft size={12} />
              </Link>
            </div>
          </div>
        ))}

        {patientList.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-3">
            <span className="p-4 bg-slate-900 rounded-full text-slate-500">
              <Search size={32} />
            </span>
            <div>
              <p className="text-white font-bold">No patients found</p>
              <p className="text-slate-500 text-xs mt-1">Try modifying your search keywords or parameters.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
