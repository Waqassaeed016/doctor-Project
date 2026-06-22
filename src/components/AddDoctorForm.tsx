'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddDoctorForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ text: 'Doctor name is required.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, specialization, phone, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMsg({ text: `Dr. ${name} successfully registered!`, type: 'success' });
        setName('');
        setSpecialization('');
        setPhone('');
        setEmail('');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to register doctor');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Error occurred', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
        <UserPlus size={16} className="text-teal-400" />
        Register Attending Doctor
      </h3>

      {msg.text && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
          msg.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Salman Khan"
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
          required
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">Specialization</label>
        <input 
          type="text" 
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="e.g. Cardiologist, Dermatologist..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 923001234567"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. dr.salman@clinic.com"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 text-xs"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-700 text-slate-950 font-bold text-xs rounded-lg transition"
      >
        {isSubmitting ? 'Registering...' : 'Register Practitioner'}
      </button>
    </form>
  );
}
