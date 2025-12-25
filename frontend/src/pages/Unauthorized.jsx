export default function Unauthorized() {
  return (
    <div className="p-6 border border-slate-800 rounded">
      <h2 className="text-2xl font-bold">Unauthorized</h2>
      <p className="text-slate-300 mt-2">You don’t have permission to view this page.</p>
    </div>
  );
}
