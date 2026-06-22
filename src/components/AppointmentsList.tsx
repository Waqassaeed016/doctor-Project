'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Check, X, AlertCircle } from 'lucide-react';

interface AppointmentRow {
  id: string;
  patientName: string;
  phone: string;
  doctorId: string | null;
  doctorName: string | null;
  appointmentTime: Date | null;
  status: string;
  symptoms: string | null;
  createdAt: Date;
}

interface DoctorOption {
  id: string;
  name: string;
  specialization: string | null;
}

interface AppointmentsListProps {
  appointments: AppointmentRow[];
  doctors: DoctorOption[];
}

export default function AppointmentsList({ appointments: initialAppointments, doctors }: AppointmentsListProps) {
  const router = useRouter();
  const [appointmentsList, setAppointmentsList] = useState<AppointmentRow[]>(initialAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempDoctorId, setTempDoctorId] = useState('');
  const [tempTime, setTempTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartEdit = (app: AppointmentRow) => {
    setEditingId(app.id);
    setTempDoctorId(app.doctorId || doctors[0]?.id || '');
    
    // Format date for datetime-local input
    if (app.appointmentTime) {
      const date = new Date(app.appointmentTime);
      // Adjust to local datetime string format: YYYY-MM-DDTHH:mm
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      setTempTime(localISOTime);
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
      setTempTime(localISOTime);
    }
  };

  const handleSaveEdit = async (appointmentId: string, status?: string) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          doctorId: tempDoctorId || null,
          appointmentTime: tempTime ? new Date(tempTime).toISOString() : null,
          status: status || 'approved'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to update appointment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatusOnly = async (appointmentId: string, newStatus: string) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: newStatus
        })
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-900/20">
        <table className="w-full text-left text-sm text-slate-300">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-800 font-semibold">
              <th className="p-4">Patient Details</th>
              <th className="p-4">Assigned Doctor</th>
              <th className="p-4">Scheduled Date/Time</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {appointmentsList.map((app) => (
              <tr key={app.id} className="hover:bg-slate-800/10 transition">
                
                {/* Patient details */}
                <td className="p-4">
                  <div className="font-bold text-white">{app.patientName}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{app.phone}</div>
                  <div className="text-xs text-slate-400 mt-2 bg-slate-950/40 p-2 rounded border border-slate-800/60 max-w-[280px]">
                    <span className="text-slate-500 font-bold block mb-0.5">Symptoms:</span>
                    <span className="line-clamp-2">{app.symptoms || 'No symptoms defined.'}</span>
                  </div>
                </td>

                {/* Assigned Doctor */}
                <td className="p-4">
                  {editingId === app.id ? (
                    <select
                      value={tempDoctorId}
                      onChange={(e) => setTempDoctorId(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-slate-500" />
                      <span className="font-semibold text-slate-200">{app.doctorName || 'Not Assigned'}</span>
                    </div>
                  )}
                </td>

                {/* Time */}
                <td className="p-4">
                  {editingId === app.id ? (
                    <input
                      type="datetime-local"
                      value={tempTime}
                      onChange={(e) => setTempTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  ) : (
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-500" />
                        {app.appointmentTime ? new Date(app.appointmentTime).toLocaleDateString() : 'Unscheduled'}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={13} className="text-slate-500" />
                        {app.appointmentTime ? new Date(app.appointmentTime).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}) : 'TBD'}
                      </span>
                    </div>
                  )}
                </td>

                {/* Status Badge */}
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    app.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : app.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : app.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {app.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  {editingId === app.id ? (
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(app.id)}
                        disabled={isSubmitting}
                        className="p-1.5 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 transition"
                        title="Save & Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleStartEdit(app)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs transition"
                        >
                          Approve
                        </button>
                      )}

                      {app.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatusOnly(app.id, 'completed')}
                          className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded text-xs transition"
                        >
                          Complete
                        </button>
                      )}

                      {app.status !== 'completed' && app.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateStatusOnly(app.id, 'cancelled')}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded border border-rose-500/20 transition"
                          title="Cancel Appointment"
                        >
                          <X size={14} />
                        </button>
                      )}

                      {app.status === 'completed' && (
                        <span className="text-slate-500 text-xs italic">Archived</span>
                      )}
                    </div>
                  )}
                </td>

              </tr>
            ))}

            {appointmentsList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                  No appointments registered in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
