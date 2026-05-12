export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-grid bg-glow flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-coral-500/20 border border-coral-500/30 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-coral-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-white/40">Cargando Nido...</p>
      </div>
    </div>
  );
}
