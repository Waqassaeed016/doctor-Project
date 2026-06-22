import { db } from '@/db';
import { appointments, patients, doctors } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AppointmentsList from '@/components/AppointmentsList';

// Fallback Mock data
const mockDoctors = [
  { id: 'd1', name: 'Dr. Adnan Malik', specialization: 'Cardiologist' },
  { id: 'd2', name: 'Dr. Ayesha Ray', specialization: 'General Physician' }
];

const mockAppointments = [
  { 
    id: 'a1', 
    patientName: 'Waqas Khan', 
    phone: '923001234567',
    doctorId: null,
    doctorName: null,
    appointmentTime: null,
    status: 'pending',
    symptoms: 'High fever and headache since 2 days',
    createdAt: new Date()
  },
  { 
    id: 'a2', 
    patientName: 'Sarah Ahmed', 
    phone: '923009876543',
    doctorId: 'd2',
    doctorName: 'Dr. Ayesha Ray',
    appointmentTime: new Date(Date.now() + 86400000),
    status: 'approved',
    symptoms: 'Severe back pain',
    createdAt: new Date(Date.now() - 3600000)
  }
];

async function getAppointmentsData() {
  try {
    const list = await db.select({
      id: appointments.id,
      patientName: patients.name,
      phone: patients.phone,
      doctorId: appointments.doctorId,
      doctorName: doctors.name,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status,
      symptoms: appointments.symptoms,
      createdAt: appointments.createdAt
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .orderBy(desc(appointments.createdAt));

    const activeDoctors = await db.select({
      id: doctors.id,
      name: doctors.name,
      specialization: doctors.specialization
    })
    .from(doctors)
    .where(eq(doctors.isActive, true));

    return {
      appointmentsList: list,
      doctorsList: activeDoctors.length > 0 ? activeDoctors : mockDoctors,
      isDemo: false
    };
  } catch (error) {
    console.warn("DB appointments fetch failed, falling back to mock:", error);
    return {
      appointmentsList: mockAppointments,
      doctorsList: mockDoctors,
      isDemo: true
    };
  }
}

export default async function AppointmentsPage() {
  const { appointmentsList, doctorsList, isDemo } = await getAppointmentsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointment Scheduler</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage patient bookings from WhatsApp, assign doctors, and set times.</p>
        </div>

        {isDemo && (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-md font-semibold self-start sm:self-center">
            Demo Sandbox Scheduler
          </span>
        )}
      </div>

      {/* Interactive List Component */}
      <AppointmentsList appointments={appointmentsList} doctors={doctorsList} />
    </div>
  );
}
