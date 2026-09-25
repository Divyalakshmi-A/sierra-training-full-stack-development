import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/dist/Assets.js';
import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/course-book.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/retail-store.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/log.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/refresh.js';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
