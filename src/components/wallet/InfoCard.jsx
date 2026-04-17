export default function InfoCard({ label, value, onCopy, trailingAction }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        <p className="truncate font-mono text-sm text-slate-300">{value}</p>
        {trailingAction}
        <button onClick={onCopy} className="text-slate-400 hover:text-white">
          <i className="fas fa-copy"></i>
        </button>
      </div>
    </div>
  );
}
