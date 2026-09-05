import React from 'react';
import { Activity, Clock, ShieldCheck, Tag, X, User, Bot, AlertTriangle } from 'lucide-react';

export default function AuditTimeline({ isOpen, onClose, logs = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0b0f19] border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-fadeIn">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Agent Activity Audit Trail</h3>
            <p className="text-[11px] text-slate-400">Real-Time Money-Action Transparency Log</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Audit Log Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs font-sans">
            No audit records logged yet for this session.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="glass-card rounded-xl p-3.5 border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-[10.5px]">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    log.event.includes('SUCCESS') || log.event.includes('COMPLETED')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : log.event.includes('EXTRACTED') || log.event.includes('RECOMMENDATION')
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : log.event.includes('RAZORPAY')
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.event}
                  </span>
                  <span className="text-slate-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                  src: {log.source}
                </span>
              </div>

              {/* Payload detail format */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-slate-300 overflow-x-auto text-[11px]">
                <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/40 text-[10px] text-slate-500 text-center font-sans">
        Audit trail records are immutable and appended on every tool execution.
      </div>
    </div>
  );
}
