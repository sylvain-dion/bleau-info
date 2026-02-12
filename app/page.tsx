export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Bleau<span className="text-primary">.info</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Guide de bloc à Fontainebleau
        </p>
        <div className="flex gap-4 justify-center">
          <button className="min-touch px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold transition-colors">
            Explorer la carte
          </button>
          <button className="min-touch px-6 py-3 border-2 border-border hover:bg-accent rounded-lg font-bold transition-colors">
            Se connecter
          </button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Application en cours de développement • Story 1.1 ✓
        </p>
      </div>
    </main>
  )
}
