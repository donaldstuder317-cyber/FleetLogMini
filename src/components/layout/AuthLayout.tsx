import { Outlet } from 'react-router-dom';
import { Wordmark } from './Wordmark';

/** Centered card for the sign-in / sign-up pages; no app navigation. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-10 text-ink">
      <main className="w-full max-w-md">
        <Wordmark className="mb-6 text-center text-3xl" />
        <div className="rounded-xl border border-line bg-surface p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
