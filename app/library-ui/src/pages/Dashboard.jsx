import { useEffect, useState } from 'react';
import { Title, BusyIndicator, Button } from '@ui5/webcomponents-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { canManage } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    books: 0,
    members: null,
    issued: 0,
    overdue: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksRes, issuesRes] = await Promise.all([
        api.getBooks(),
        api.getIssueRecords('?$expand=book,member'),
      ]);
      const books = booksRes.value || [];
      const issues = issuesRes.value || [];
      const active = issues.filter((i) => i.status === 'ISSUED');
      const overdue = active.filter((i) => i.dueDate && i.dueDate < todayISO());

      let membersCount = null;
      if (canManage()) {
        try {
          const membersRes = await api.getMembers();
          membersCount = (membersRes.value || []).length;
        } catch (err) {
          if (err.status !== 403) throw err;
        }
      }

      setStats({
        books: books.length,
        members: membersCount,
        issued: active.length,
        overdue: overdue.length,
      });
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [canManage]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <BusyIndicator active size="Medium" />
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Title level="H2" className="page-title" style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Button icon="refresh" onClick={loadData}>
          Refresh
        </Button>
      </div>
      <div className="tile-grid">
        <div className="stat-tile">
          <div className="label">Total books</div>
          <div className="value">{stats.books}</div>
        </div>
        {canManage() && (
          <div className="stat-tile">
            <div className="label">Total members</div>
            <div className="value">{stats.members ?? '—'}</div>
          </div>
        )}
        <div className="stat-tile">
          <div className="label">Currently issued</div>
          <div className="value">{stats.issued}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Overdue</div>
          <div className="value">{stats.overdue}</div>
        </div>
      </div>
    </div>
  );
}
