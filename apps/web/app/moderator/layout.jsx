import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function ModeratorLayout({ children }) {
  return <AppShell role="moderator"><ProtectedRoute roles={['moderator']}>{children}</ProtectedRoute></AppShell>;
}
