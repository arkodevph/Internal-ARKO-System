import { Board } from "@/components/board";
import { AuthGate, SignOutButton } from '@arko/edge-auth/gate'

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <AuthGate>
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">PM Board</h1>
          <p className="text-sm text-neutral-400">
            Nothing reaches Done without a recorded review.
          </p>
        </div>
        <SignOutButton />
      </header>
      <Board />
    </main>
    </AuthGate>
  );
}
