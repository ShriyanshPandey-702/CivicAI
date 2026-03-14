import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, AlertCircle, CheckCircle, Bot, FileText, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCitizen } from '@/lib/CitizenContext';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'action';
  title: string;
  message: string;
  link?: string;
  linkText?: string;
  read: boolean;
}

const NotificationsPage = () => {
  const { citizenId, citizenProfile, analysisComplete, analysisExpired, schemeCards, appliedSchemes, setNotificationCount } = useCitizen();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate dynamic notifications based on current user state
  useEffect(() => {
    const notes: Notification[] = [];

    if (!citizenId) {
      notes.push({
        id: 'no_profile',
        type: 'action',
        title: 'Complete Your Profile',
        message: 'Create your citizen profile to start discovering government schemes you\'re eligible for.',
        link: '/register',
        linkText: 'Create Profile',
        read: false,
      });
    }

    if (citizenId && !analysisComplete) {
      notes.push({
        id: 'run_analysis',
        type: 'action',
        title: 'Run AI Analysis',
        message: 'Your profile is ready! Run the AI agent to discover eligible government schemes.',
        link: '/dashboard/agent',
        linkText: 'Start Analysis',
        read: false,
      });
    }

    if (analysisExpired) {
      notes.push({
        id: 'analysis_expired',
        type: 'warning',
        title: 'Analysis Expired',
        message: 'Your previous scheme analysis is no longer in memory. Re-run to refresh your results.',
        link: '/dashboard/agent',
        linkText: 'Refresh Analysis',
        read: false,
      });
    }

    if (analysisComplete && schemeCards.length > 0) {
      notes.push({
        id: 'schemes_found',
        type: 'success',
        title: `${schemeCards.length} Eligible Schemes Found`,
        message: `You are eligible for ${schemeCards.length} government schemes. Visit the schemes page to apply.`,
        link: '/dashboard/schemes',
        linkText: 'View Schemes',
        read: true,
      });
    }

    if (appliedSchemes.length > 0) {
      const latest = appliedSchemes[0];
      notes.push({
        id: 'latest_app',
        type: 'success',
        title: 'Application Submitted',
        message: `Your application for "${latest.scheme_name}" (Ref: ${latest.reference_id}) is being processed.`,
        link: '/dashboard/apply',
        linkText: 'Track Status',
        read: true,
      });
    }

    if (citizenId && citizenProfile) {
      notes.push({
        id: 'upload_docs',
        type: 'info',
        title: 'Upload Documents',
        message: 'Upload your Aadhaar, income certificate, and other documents to speed up applications.',
        link: '/dashboard/documents',
        linkText: 'Upload Now',
        read: true,
      });
    }

    setNotifications(notes);
  }, [citizenId, citizenProfile, analysisComplete, analysisExpired, schemeCards, appliedSchemes]);

  // On visiting notification page, mark all as read & clear badge
  useEffect(() => {
    setNotificationCount(0);
  }, [setNotificationCount]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationCount(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const iconMap = {
    info: <Bell className="w-5 h-5 text-india-blue" />,
    success: <CheckCircle className="w-5 h-5 text-ashoka-green" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    action: <Bot className="w-5 h-5 text-primary" />,
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-secondary hover:underline flex items-center gap-1">
            <BellOff className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No Notifications</h3>
          <p className="text-muted-foreground">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(note => (
            <div
              key={note.id}
              className={`bg-card border rounded-xl p-4 flex items-start gap-4 transition-all ${
                note.read ? 'border-border' : 'border-primary/30 bg-primary/[0.02]'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {iconMap[note.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground text-sm">{note.title}</h3>
                  {!note.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{note.message}</p>
                {note.link && (
                  <Link to={note.link} className="text-xs text-secondary hover:underline mt-2 inline-flex items-center gap-1">
                    {note.linkText} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationsPage;
