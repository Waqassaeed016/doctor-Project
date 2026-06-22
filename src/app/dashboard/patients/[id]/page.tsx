import { db } from '@/db';
import { patients, appointments, prescriptions, doctors, medicalFiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  User, 
  Phone, 
  FileText, 
  Calendar, 
  Download, 
  FolderLock, 
  Clock, 
  Stethoscope,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import PrescriptionForm from '@/components/PrescriptionForm';
import ReportUploadForm from '@/components/ReportUploadForm';

// Fallback Mock data
const mockPatient = {
  id: '1',
  name: 'Waqas Khan',
  phone: '923001234567',
  age: 28,
  gender: 'Male',
  medicalHistory: 'Hypertension history. Allergic to penicillin.',
  createdAt: new Date()
};

const mockDoctors = [
  { id: 'd1', name: 'Dr. Adnan Malik', specialization: 'Cardiologist' },
  { id: 'd2', name: 'Dr. Ayesha Ray', specialization: 'General Physician' }
];

const mockAppointments = [
  { 
    id: 'a1', 
    doctorName: 'Dr. Ayesha Ray', 
    appointmentTime: new Date(Date.now() - 86400000), 
    status: 'completed', 
    symptoms: 'High fever and headache' 
  },
  { 
    id: 'a2', 
    doctorName: 'Dr. Adnan Malik', 
    appointmentTime: new Date(Date.now() + 86400000), 
    status: 'approved', 
    symptoms: 'Mild chest pressure' 
  }
];

const mockPrescriptions = [
  {
    id: 'pr1',
    doctorName: 'Dr. Ayesha Ray',
    diagnosis: 'Viral Influenza',
    medicines: [
      { name: 'Panadol', dosage: '500mg', frequency: '1-1-1', duration: '5 days' },
      { name: 'Surbex-Z', dosage: '1 tab', frequency: '0-1-0', duration: '10 days' }
    ],
    createdAt: new Date(Date.now() - 86400000)
  }
];

const mockFiles = [
  { id: 'f1', fileName: 'Blood_Report_May.pdf', fileUrl: 'https://drive.google.com/mock-blood-report', fileType: 'application/pdf', uploadedAt: new Date() },
  { id: 'f2', fileName: 'X_Ray_Chest.jpg', fileUrl: 'https://drive.google.com/mock-xray', fileType: 'image/jpeg', uploadedAt: new Date() }
];

async function getPatientDetails(id: string) {
  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id)
    });

    if (!patient) return null;

    // Fetch related records
    const apps = await db.select({
      id: appointments.id,
      doctorName: doctors.name,
      appointmentTime: appointments.appointmentTime,
      status: appointments.status,
      symptoms: appointments.symptoms
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(eq(appointments.patientId, id))
    .orderBy(desc(appointments.createdAt));

    const rx = await db.select({
      id: prescriptions.id,
      doctorName: doctors.name,
      diagnosis: prescriptions.diagnosis,
      medicines: prescriptions.medicines,
      createdAt: prescriptions.createdAt
    })
    .from(prescriptions)
    .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
    .where(eq(prescriptions.patientId, id))
    .orderBy(desc(prescriptions.createdAt));

    const files = await db.select()
      .from(medicalFiles)
      .where(eq(medicalFiles.patientId, id))
      .orderBy(desc(medicalFiles.uploadedAt));

    const activeDoctors = await db.select({
      id: doctors.id,
      name: doctors.name,
      specialization: doctors.specialization
    })
    .from(doctors)
    .where(eq(doctors.isActive, true));

    return {
      patient,
      appointmentsList: apps,
      prescriptionsList: rx,
      filesList: files,
      doctorsList: activeDoctors.length > 0 ? activeDoctors : mockDoctors,
      isDemo: false
    };
  } catch (error) {
    console.warn("DB query failed, returning mock patient details:", error);
    return {
      patient: mockPatient,
      appointmentsList: mockAppointments,
      prescriptionsList: mockPrescriptions,
      filesList: mockFiles,
      doctorsList: mockDoctors,
      isDemo: true
    };
  }
}

export default async function PatientProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const data = await getPatientDetails(params.id);

  if (!data) {
    return (
      <div className="py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Patient Not Found</h1>
        <p className="text-slate-500 text-sm">The patient ID does not exist in the database.</p>
        <Link href="/dashboard/patients" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300">
          <ChevronLeft size={16} /> Back to Patients
        </Link>
      </div>
    );
  }

  const { patient, appointmentsList, prescriptionsList, filesList, doctorsList, isDemo } = data;

  return (
    <div className="space-y-8">
      {/* Back & Demo Banner */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard/patients"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={16} /> Back to Directory
        </Link>

        {isDemo && (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-md font-semibold">
            Demo Sandbox Profile
          </span>
        )}
      </div>

      {/* Main Grid: Info Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Personal info & File uploads */}
        <div className="space-y-8">
          {/* Patient Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 rounded-full text-teal-400 border border-teal-500/20">
                <User size={24} />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-lg">{patient.name}</h2>
                <span className="text-xs text-slate-500">Patient Identifier:</span>
                <span className="text-xs font-mono text-slate-400 block max-w-[200px] truncate">{patient.id}</span>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-slate-800/80 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">WhatsApp Number</span>
                <span className="text-slate-300 font-semibold font-mono flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-500" /> {patient.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Age</span>
                <span className="text-slate-300 font-semibold">{patient.age ? `${patient.age} years` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="text-slate-300 font-semibold">{patient.gender || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4">
              <span className="text-xs text-slate-500 block mb-1">Medical Background</span>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {patient.medicalHistory || 'No historical medical history reported.'}
              </p>
            </div>
          </div>

          {/* Drive Documents Vault */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FolderLock size={16} className="text-teal-400" />
              Google Drive Records ({filesList.length})
            </h3>
            
            <div className="space-y-2.5">
              {filesList.map((file) => (
                <div key={file.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className="text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{file.fileName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white rounded border border-teal-500/20 transition shrink-0"
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}

              {filesList.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-6">No clinical documents in Google Drive.</p>
              )}
            </div>
          </div>

          {/* Report Upload Form */}
          <ReportUploadForm patientId={patient.id} />
        </div>

        {/* Right Columns: Prescriptions & History */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Write Prescription Form */}
          <PrescriptionForm patientId={patient.id} doctors={doctorsList} />

          {/* Prescriptions History */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-5">
              <Stethoscope size={16} className="text-teal-400" />
              Prescriptions & Medication Logs
            </h3>

            <div className="space-y-6">
              {prescriptionsList.map((rxItem) => (
                <div key={rxItem.id} className="border border-slate-800 bg-slate-950/30 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <span className="text-xs text-slate-500 block">Attending Practitioner</span>
                      <strong className="text-white text-sm">{rxItem.doctorName}</strong>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={13} className="text-slate-500" />
                      {new Date(rxItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Clinical Findings & Diagnosis</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{rxItem.diagnosis}</p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-2">Prescribed Medicines</span>
                    <div className="overflow-hidden border border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                            <th className="p-3">Medicine</th>
                            <th className="p-3">Dosage</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {Array.isArray(rxItem.medicines) && (rxItem.medicines as any[]).map((med, mIdx) => (
                            <tr key={mIdx}>
                              <td className="p-3 font-semibold text-white">{med.name}</td>
                              <td className="p-3 text-slate-400">{med.dosage}</td>
                              <td className="p-3 text-slate-400">{med.frequency}</td>
                              <td className="p-3 text-teal-400 font-semibold">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}

              {prescriptionsList.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-10">No prescriptions written yet.</p>
              )}
            </div>
          </div>

          {/* Appointments Log */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Calendar size={16} className="text-teal-400" />
              Appointment History
            </h3>

            <div className="space-y-3.5">
              {appointmentsList.map((app) => (
                <div key={app.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{app.doctorName || 'Doctor Not Assigned'}</strong>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        app.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : app.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400"><strong className="text-slate-500">Symptoms:</strong> {app.symptoms}</p>
                  </div>

                  <div className="text-right text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-500" />
                    {app.appointmentTime ? new Date(app.appointmentTime).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'TBD'}
                  </div>
                </div>
              ))}

              {appointmentsList.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-6">No appointment records found.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
