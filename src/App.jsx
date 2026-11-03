/**
 * Placeholder screen. Mobile-first; capped at 430px and centered so it
 * looks like a phone app on desktop too.
 */
function App() {
  return (
    <div className="min-h-svh bg-neutral-950">
      <main className="mx-auto flex min-h-svh max-w-[430px] flex-col items-center justify-center bg-forest-green px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-bright-green">
          Team OtherWise
        </h1>
        <p className="mt-2 text-lg text-white/80">Wise Hackathon 2026</p>
      </main>
    </div>
  )
}

export default App
