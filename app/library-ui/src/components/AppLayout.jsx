import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ShellBar,
  ShellBarItem,
  SideNavigation,
  SideNavigationItem,
} from '@ui5/webcomponents-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, canManage } = useAuth();

  const selected =
    location.pathname === '/'
      ? 'home'
      : location.pathname.startsWith('/books')
        ? 'books'
        : location.pathname.startsWith('/members')
          ? 'members'
          : location.pathname.startsWith('/issues')
            ? 'issues'
            : 'home';

  return (
    <div className="app-shell">
      <ShellBar
        primaryTitle="Library Management"
        showNotifications={false}
        profile={
          <ShellBarItem text={user?.displayName || user?.username || 'User'} icon="employee" />
        }
      >
        <ShellBarItem icon="log" text="Sign Out" onClick={logout} />
      </ShellBar>
      <div className="app-body">
        <SideNavigation>
          <SideNavigationItem
            text="Dashboard"
            icon="home"
            selected={selected === 'home'}
            onClick={() => navigate('/')}
          />
          <SideNavigationItem
            text="Book Catalog"
            icon="book"
            selected={selected === 'books'}
            onClick={() => navigate('/books')}
          />
          {canManage() && (
            <SideNavigationItem
              text="Members"
              icon="group"
              selected={selected === 'members'}
              onClick={() => navigate('/members')}
            />
          )}
          <SideNavigationItem
            text="Issue / Return"
            icon="retail-store"
            selected={selected === 'issues'}
            onClick={() => navigate('/issues')}
          />
        </SideNavigation>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
