'use client';

import { useState } from 'react';
import { Plus, Trash2, FilePenLine } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DoctorOption {
  id: string;
  name: string;
  specialization: string | null;
}

interface PrescriptionFormProps {
  patientId: string;
  doctors: DoctorOption[];
}

interface MedicineRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function PrescriptionForm({ patientId, doctors }: PrescriptionFormProps) {
  const router = useRouter();
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    const newMedicines = medicines.filter((_, idx) => idx !== index);
    setMedicines(newMedicines);
  };

  const handleMedicineChange = (index: number, field: keyof MedicineRow, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index][field] = value;
    setMedicines(newMedicines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setMsg({ text: 'Please select a doctor.', type: 'error' });
      return;
    }
    if (!diagnosis.trim()) {
      setMsg({ text: 'Please write a diagnosis.', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctorId,
          diagnosis,
          medicines: medicines.filter(m => m.name.trim() !== '')
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMsg({ text: 'Prescription successfully written!', type: 'success' });
        setDiagnosis('');
        setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to submit prescription');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <FilePenLine size={18} className="text-teal-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Write Prescription</h3>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-semibold ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Select Doctor */}
      <div>
        <label className="text-xs text-slate-400 font-semibold block mb-1.5">Attending Doctor</label>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-teal-500 transition text-sm"
        >
          <option value="">-- Choose Doctor --</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.specialization || 'General'})
            </option>
          ))}
        </select>
      </div>

      {/* Diagnosis */}
      <div>
        <label className="text-xs text-slate-400 font-semibold block mb-1.5">Diagnosis / Clinical Findings</label>
        <textarea
          rows={3}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter patient diagnosis, findings, and general advice..."
          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition text-sm resize-none"
        />
      </div>

      {/* Medicines list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs text-slate-400 font-semibold">Rx (Medicines)</label>
          <button
            type="button"
            onClick={addMedicineRow}
            className="flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 hover:underline transition"
          >
            <Plus size={12} /> Add Row
          </button>
        </div>

        {medicines.map((med, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 relative">
            <input
              type="text"
              value={med.name}
              onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
              placeholder="Med Name"
              className="px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
            />
            <input
              type="text"
              value={med.dosage}
              onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
              placeholder="Dosage (e.g., 500mg)"
              className="px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
            />
            <input
              type="text"
              value={med.frequency}
              onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
              placeholder="Frequency (e.g., 1-0-1)"
              className="px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={med.duration}
                onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                placeholder="Duration (e.g., 5 days)"
                className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
              />
              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedicineRow(idx)}
                  className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-700 text-slate-950 font-bold text-sm rounded-lg transition"
      >
        {isSubmitting ? 'Saving Prescription...' : 'Save & Print Prescription'}
      </button>
    </form>
  );
}
