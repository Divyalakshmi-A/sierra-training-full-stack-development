import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BusyIndicator } from '@ui5/webcomponents-react';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BookCatalog from './pages/BookCatalog.jsx';
import BookForm from './pages/BookForm.jsx';
import MemberManagement from './pages/MemberManagement.jsx';
import IssueReturn from './pages/IssueReturn.jsx';

import AccessDenied from './pages/AccessDenied.jsx';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, canManage, hasLibraryAccess, authMode } = useAuth();
  if (!isAuthenticated) {
    if (authMode === 'xsuaa') return <AccessDenied />;
    return <Navigate to="/login" replace />;
  }
  if (!hasLibraryAccess()) return <AccessDenied />;
  if (adminOnly && !canManage()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated, authMode, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <BusyIndicator active size="Large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : authMode === 'xsuaa' ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookCatalog />} />
          <Route
            path="books/new"
            element={
              <ProtectedRoute adminOnly>
                <BookForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="books/:id"
            element={
              <ProtectedRoute adminOnly>
                <BookForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="members"
            element={
              <ProtectedRoute adminOnly>
                <MemberManagement />
              </ProtectedRoute>
            }
          />
          <Route path="issues" element={<IssueReturn />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
