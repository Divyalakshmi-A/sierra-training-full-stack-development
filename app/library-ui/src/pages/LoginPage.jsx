import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Title } from '@ui5/webcomponents-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Title level="H3">Library Management — Login</Title>
        <form className="form-grid" onSubmit={submit}>
          <div>
            <Label showColon>Username</Label>
            <Input
              value={username}
              onInput={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label showColon>Password</Label>
            <Input
              type="Password"
              value={password}
              onInput={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div className="form-actions">
            <Button design="Emphasized" type="Submit" disabled={busy}>
              {busy ? 'Logging in…' : 'Login'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
