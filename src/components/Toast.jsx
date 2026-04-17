export default function Toast({ message, show, isError }) {
  if (!show) return null;

  return (
    <div
      className={`fixed right-5 top-20 z-50 rounded-lg px-6 py-3 text-base text-white shadow-lg transition-transform duration-300 ${show ? 'translate-x-0' : 'translate-x-full'} ${isError ? 'bg-red-500' : 'bg-green-500'}`}
    >
      {message}
    </div>
  );
}
