import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { notificationsApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function PatientNotifications() {
  const navigate = useNavigate();
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

  const resolveNotificationRoute = (notification) => {
    const sourceType = notification.sourceType || notification.type;
    const sourceId = notification.sourceId;
    if (!sourceType || !sourceId) return null;
    if (sourceType === 'appointment') {
      return `/patient/appointments?appointmentId=${sourceId}`;
    }
    if (sourceType === 'labOrder') {
      return `/patient/lab-tests?orderId=${sourceId}`;
    }
    if (sourceType === 'pharmacyOrder') {
      return `/patient/medicine-orders?orderId=${sourceId}`;
    }
    if (sourceType === 'invoice' || notification.type === 'billing') {
      return `/patient/bills?invoiceId=${sourceId}`;
    }
    return null;
  };

  const openNotification = async (notification) => {
    const route = resolveNotificationRoute(notification);
    if (notification.status !== 'read') {
      await markRead(notification.id);
    }
    if (route) {
      navigate(route);
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Notifications</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Care alerts and updates</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Stay on top of lab results, medicine readiness, and payment reminders. Unread alerts appear first.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Unread alerts: <span className="font-semibold text-foreground">{unreadCount}</span>
        </p>
        <Button variant="outline" onClick={markAllRead} disabled={notifications.length === 0}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            role="button"
            tabIndex={0}
            onClick={() => openNotification(notification)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openNotification(notification);
              }
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={notification.type}>{notification.type}</StatusBadge>
                <StatusBadge status={notification.status}>{notification.status}</StatusBadge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  openNotification(notification);
                }}
              >
                View details
              </Button>
              {notification.status !== 'read' && (
                <Button
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    markRead(notification.id);
                  }}
                >
                  Mark as read
                </Button>
              )}
            </div>
          </article>
        ))}

        {!loading && notifications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No notifications yet. You will see lab, pharmacy, and billing updates here.
          </div>
        )}
      </div>
    </motion.section>
  );
}
