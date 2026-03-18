import { useState } from 'react';
import api from '../utils/api';
import { UploadCloud, AlertCircle } from 'lucide-react';

const ReportUpload = () => {
    const [type, setType] = useState('WEEKLY');
    const [fileUrl, setFileUrl] = useState(''); // Placeholder until Cloudinary widget is fully hooked
    const [dueDate, setDueDate] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Simulating cloudinary upload, we send a string url for now
            const fakeCloudinaryUrl = `https://cloudinary.com/dbu-ims/${Math.random().toString(36).substring(7)}.pdf`;
            
            const res = await api.post('/student/reports', {
                type,
                fileUrl: fileUrl || fakeCloudinaryUrl,
                dueDate
            });

            // The backend responds with the `report` object including versioning and isLate checks
            const isLate = res.data.isLate;
            const version = res.data.version;

            setMessage(`Success! Report uploaded (v${version}). ${isLate ? '(Calculated as LATE)' : '(Submitted On-Time)'}`);
        } catch (err) {
            setMessage(`Upload Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-8 mt-8">
            <div className="text-center mb-6">
                <UploadCloud className="w-12 h-12 text-dbu-primary mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-800">Submit Report</h2>
                <p className="text-sm text-slate-500">Upload your PDF/DOCX reports. Version tracing is automatic.</p>
            </div>

            {message && (
              <div className={`p-4 mb-6 rounded flex items-start ${message.includes('LATE') || message.includes('Failed') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none bg-white"
                    >
                        <option value="WEEKLY">Weekly Report</option>
                        <option value="MONTHLY">Monthly Report</option>
                        <option value="FINAL">Final Project Report</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Due Date</label>
                    <input 
                        type="date" 
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">If submitted past this date, the system flags it automatically.</p>
                </div>

                {/* Cloudinary UI Placeholder */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                    <span className="text-sm text-slate-500 font-medium">Click to select file (PDF/DOCX)</span>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-dbu-primary text-white py-3 rounded-md hover:bg-dbu-accent transition disabled:opacity-50 font-medium"
                >
                    {loading ? 'Uploading & Versioning...' : 'Upload Report'}
                </button>
            </form>
        </div>
    );
};

export default ReportUpload;
