import AppShell from '../../components/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function TeacherLayout({ children }) {
  return <AppShell role="teacher"><ProtectedRoute roles={['teacher']}>{children}</ProtectedRoute></AppShell>;
}
