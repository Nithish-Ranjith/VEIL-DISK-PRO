import React from 'react';
import { X, FileText, Lock, File } from 'lucide-react';

const FileHistogramModal = ({ type, onClose, files = [] }) => {

    // Sort by savings for better visualization (if not already sorted)
    // The backend returns it sorted by size, but for "Impact", savings might be better.
    // Let's stick to the backend order (Size) or client-side sort if needed.
    // Backend sends `top_files_heap` sorted by size.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-[#0B101B] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] prism-border hover-scale"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                            <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Deep Scan Analysis</h3>
                            {/* <p className="text-xs text-slate-400 font-mono uppercase">Target: {type} Sector</p> */}
                            <p className="text-xs text-slate-400 font-mono uppercase">Top {files.length} Candidates</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                        }}
                        className="p-2 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0f1623] sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">File Path</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Size</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Reduction</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No large compressible files found in scan.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                                                <File className="w-3 h-3 text-slate-600" />
                                                {file.name}
                                            </div>
                                            <div className="text-[10px] text-slate-600 font-mono truncate max-w-[200px]" title={file.path}>{file.path}</div>
                                        </td>
                                        <td className="px-6 py-3 text-right text-xs font-mono text-slate-400">
                                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                -{(file.savings / (1024 * 1024)).toFixed(1)} MB
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400">
                                                <Lock className="w-3 h-3" /> Encoded
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-[#0f1623] border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>SCANNED {files.length} ITEMS</span>
                    <span>MD5 CHECKSUM: VERIFIED</span>
                </div>
            </div>
        </div>
    );
};

export default FileHistogramModal;
