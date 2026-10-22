import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useFleet';
import { cn } from '../../lib/cn';
import { signOut } from '../../services/authService';
import { Button } from '../common/Button';

/** Signed-in user's name/email and a Sign out button: stacked in the sidebar, one row in the mobile top bar. */
export function UserMenu({ layout }: { layout: 'stack' | 'inline' }) {
  const { displayName, user } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await signOut(); // RequireAuth then sends this tab (and any other) to /sign-in
    } catch {
      showToast("Couldn't sign out — try again", 'error');
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        'flex min-w-0 gap-3',
        layout === 'stack' ? 'mt-auto flex-col border-t border-line pt-4' : 'items-center justify-end',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" data-testid="user-name">{displayName}</p>
        {user?.email && user.email !== displayName && (
          <p className="truncate text-sm text-muted">{user.email}</p>
        )}
      </div>
      <Button variant="ghost" className="shrink-0 px-3" disabled={pending} onClick={onSignOut}>
        <LogOut size={18} aria-hidden /> Sign out
      </Button>
    </div>
  );
}
