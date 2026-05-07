import React from 'react';
import { X, Download, AlertCircle, FileText } from 'lucide-react';

const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileName, mimeType }) => {
    if (!isOpen) return null;

    const isPDF = mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf') || fileUrl?.toLowerCase().endsWith('.pdf');
    const isDOCX = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   fileName?.toLowerCase().endsWith('.docx') || fileName?.toLowerCase().endsWith('.doc') || 
                   fileUrl?.toLowerCase().endsWith('.docx') || fileUrl?.toLowerCase().endsWith('.doc');

    // Ensure we have a valid URL. If it's a relative path from backend, prefix it.
    const fullUrl = fileUrl?.startsWith('http') ? fileUrl : `http://localhost:5001${fileUrl}`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-dbu-primary/10 rounded-xl">
                            <FileText className="w-5 h-5 text-dbu-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 truncate max-w-[200px] md:max-w-md">{fileName || 'Report Preview'}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Viewer</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={fullUrl}
                            download={fileName}
                            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm hidden md:flex"
                        >
                            <Download size={16} />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-200/50 relative">
                    {isPDF ? (
                        <iframe
                            src={fullUrl}
                            className="w-full h-full border-none"
                            title="PDF Preview"
                        />
                    ) : isDOCX ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-dbu-primary animate-bounce">
                                <FileText size={48} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-black text-slate-800">Preview not available for DOCX files.</h4>
                                <p className="text-sm text-slate-500 font-medium">For security and stability, Word documents must be downloaded to view.</p>
                            </div>
                            <a
                                href={fullUrl}
                                download={fileName}
                                className="px-8 py-4 bg-dbu-primary text-white rounded-2xl font-black text-xs tracking-widest hover:bg-dbu-accent transition-all shadow-xl shadow-dbu-primary/20 flex items-center gap-3"
                            >
                                <Download size={18} />
                                DOWNLOAD FILE
                            </a>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <AlertCircle size={48} className="text-amber-500" />
                            <p className="text-slate-600 font-bold">Unsupported file type for preview.</p>
                            <a href={fullUrl} download className="px-6 py-3 bg-dbu-primary text-white rounded-xl font-bold">Download File</a>
                        </div>
                    )}
                </div>

                {/* Footer / Info */}
                <div className="p-4 bg-white border-t border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        PDF format is recommended for better preview support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
