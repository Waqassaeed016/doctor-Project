import { db } from '@/db';
import { doctors } from '@/db/schema';
import { desc, count } from 'drizzle-orm';
import { Stethoscope, Phone, Mail, UserCheck } from 'lucide-react';
import AddDoctorForm from '@/components/AddDoctorForm';

// Fallback Mock Doctors
const mockDoctors = [
  { id: 'd1', name: 'Dr. Adnan Malik', specialization: 'Cardiologist', phone: '923001234567', email: 'adnan.malik@clinic.com', isActive: true },
  { id: 'd2', name: 'Dr. Ayesha Ray', specialization: 'General Physician', phone: '923009876543', email: 'ayesha.ray@clinic.com', isActive: true }
];

async function getDoctorsData() {
  try {
    const list = await db.select().from(doctors).orderBy(desc(doctors.createdAt));
    return {
      doctorsList: list,
      isDemo: false
    };
  } catch (error) {
    console.warn("Failed to fetch doctors, falling back to mock:", error);
    return {
      doctorsList: mockDoctors,
      isDemo: true
    };
  }
}

export default async function DoctorsPage() {
  const { doctorsList, isDemo } = await getDoctorsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctors Directory</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage active clinical staff and view specializations.</p>
        </div>

        {isDemo && (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-md font-semibold self-start sm:self-center">
            Demo Sandbox Directory
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns: Doctors Directory List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-900/20">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Stethoscope size={16} className="text-teal-400" />
                Active Practitioners ({doctorsList.length})
              </h3>
            </div>
            
            <div className="divide-y divide-slate-800/40">
              {doctorsList.map((doc) => (
                <div key={doc.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-800/10 transition">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-white text-base leading-tight">{doc.name}</h4>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold uppercase">
                      {doc.specialization || 'General Physician'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 text-xs text-slate-400">
                    {doc.phone && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone size={12} className="text-slate-500" /> {doc.phone}
                      </span>
                    )}
                    {doc.email && (
                      <span className="flex items-center gap-1.5 font-mono">
                        <Mail size={12} className="text-slate-500" /> {doc.email}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-slate-300">Active</span>
                  </div>
                </div>
              ))}

              {doctorsList.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No doctors registered yet. Please add one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Register Form */}
        <div>
          <AddDoctorForm />
        </div>

      </div>
    </div>
  );
}
