import { ButtonLink } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState title="Page not found" action={<ButtonLink to="/">Back to Dashboard</ButtonLink>} />
  );
}
