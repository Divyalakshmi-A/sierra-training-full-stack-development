import { Button, Title } from '@ui5/webcomponents-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccessDenied() {
  const { user, logout, authMode } = useAuth();

  return (
    <div className="login-page">
      <div className="login-card">
        <Title level="H3">No library role assigned</Title>
        <p style={{ marginTop: '1rem', lineHeight: 1.5 }}>
          You are signed in as <strong>{user?.displayName || user?.username || 'a BTP user'}</strong>{' '}
          via SAP (XSUAA). The mock Login page is only for local development.
        </p>
        <p style={{ lineHeight: 1.5 }}>
          In BTP Cockpit go to <strong>Security → Users</strong> (or your user), assign role collection{' '}
          <strong>Library-Admin</strong> or <strong>Library-Member</strong>, then log out and open the
          app again.
        </p>
        <div className="form-actions">
          <Button design="Emphasized" onClick={logout}>
            {authMode === 'xsuaa' ? 'Log out and switch user' : 'Log out'}
          </Button>
        </div>
      </div>
    </div>
  );
}
