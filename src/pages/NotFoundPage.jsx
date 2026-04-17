import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-10 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
        <h2 className="mt-3 text-4xl font-semibold text-white">Route not found</h2>
        <p className="mt-4 text-slate-400">This page does not exist in the new router structure.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-bold text-slate-950"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
