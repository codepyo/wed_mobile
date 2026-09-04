import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminApp from './admin/AdminApp';
import './styles/global.css';
import './styles/hero-typography.css';
import './styles/features.css';
import './styles/forms.css';
import './styles/map.css';
import './styles/event.css';
import './styles/event-live.css';
import './styles/event-quality.css';
import './styles/quality.css';
import './styles/admin.css';
import './styles/admin-media.css';
import './styles/admin-content.css';
import './styles/admin-responsive.css';

const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </StrictMode>,
);
