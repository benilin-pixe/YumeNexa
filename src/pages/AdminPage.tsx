import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  AdminLayout,
  AdminSection,
} from '../components/admin/AdminLayout';
import {
  AdminPasswordModal,
  isAdminAuthenticated,
} from '../components/admin/AdminPasswordModal';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminMoviesView } from './admin/AdminMoviesView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminNotificationsView } from './admin/AdminNotificationsView';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface AdminPageProps {
  onExitAdmin: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onExitAdmin }) => {
  const { user, isAdmin, authLoading } = useAuth() as any;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'movies') setActiveSection('movies');
      else if (hash === 'users') setActiveSection('users');
      else if (hash === 'notifications') setActiveSection('notifications');
      else if (hash === 'dashboard' || !hash) setActiveSection('dashboard');
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigateSection = (section: AdminSection) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  // 1. Auth Loading state -> Show spinner, make NO Firestore calls
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-xs text-[#a09cb0]">Verifying authentication status...</p>
      </div>
    );
  }

  // 2. No user -> Prompt password gate or redirect
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <AdminPasswordModal
          isOpen={true}
          onSuccess={handlePasswordSuccess}
          onClose={onExitAdmin}
        />
      </div>
    );
  }

  return (
    <AdminLayout
      currentSection={activeSection}
      onNavigate={handleNavigateSection}
      onExitAdmin={onExitAdmin}
    >
      {activeSection === 'dashboard' && (
        <AdminDashboardView onNavigate={handleNavigateSection} />
      )}

      {activeSection === 'movies' && <AdminMoviesView />}

      {activeSection === 'users' && <AdminUsersView />}

      {activeSection === 'notifications' && <AdminNotificationsView />}
    </AdminLayout>
  );
};

export default AdminPage;
