'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportUploadFormProps {
  patientId: string;
}

export default function ReportUploadForm({ patientId }: ReportUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMsg({ text: '', type: '' });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMsg({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMsg({ text: '', type: '' });

    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMsg({ text: `File "${file.name}" uploaded to Google Drive!`, type: 'success' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to upload file');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
        <UploadCloud size={18} className="text-teal-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Medical Reports</h3>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
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

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-950/40 rounded-lg p-6 text-center cursor-pointer transition"
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf"
          />
          <div className="flex flex-col items-center gap-2">
            <UploadCloud size={28} className="text-slate-500" />
            {file ? (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold bg-teal-500/10 px-2.5 py-1 rounded">
                <FileText size={12} />
                <span className="max-w-[200px] truncate">{file.name}</span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-300 font-bold">Click to browse reports</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PDF, JPEG, PNG (max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-lg transition"
        >
          {isUploading ? 'Uploading to Google Drive...' : 'Upload Report'}
        </button>
      </form>
    </div>
  );
}
