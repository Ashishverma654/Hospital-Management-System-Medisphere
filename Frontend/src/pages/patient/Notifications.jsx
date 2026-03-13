import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { notificationsApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getMy();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read').length,
    [notifications]
  );

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, status: 'read', readAt: new Date().toISOString() } : item))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark notification.');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, status: 'read', readAt: item.readAt || new Date().toISOString() })));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark all read.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Notifications</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Care alerts and updates</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Stay on top of lab results, medicine readiness, and payment reminders. Unread alerts appear first.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Unread alerts: <span className="font-semibold text-slate-900">{unreadCount}</span>
        </p>
        <Button variant="outline" onClick={markAllRead} disabled={notifications.length === 0}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <article key={notification.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={notification.type}>{notification.type}</StatusBadge>
                <StatusBadge status={notification.status}>{notification.status}</StatusBadge>
              </div>
            </div>

            {notification.status !== 'read' && (
              <Button variant="outline" className="mt-4" onClick={() => markRead(notification.id)}>
                Mark as read
              </Button>
            )}
          </article>
        ))}

        {!loading && notifications.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No notifications yet. You will see lab, pharmacy, and billing updates here.
          </div>
        )}
      </div>
    </section>
  );
}
