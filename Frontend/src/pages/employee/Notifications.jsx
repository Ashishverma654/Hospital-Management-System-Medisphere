import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { notificationsApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import { Activity, BellRing, CalendarDays, FlaskConical, Pill, ShieldAlert, ClipboardList } from 'lucide-react';

export default function EmployeeNotifications() {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.user?.role);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [preferences, setPreferences] = useState({
    mutedTypes: [],
    mutedPriorities: [],
    muteAll: false,
    allowUrgentSound: true,
  });
  const urgentSeenRef = useRef(new Set());

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [data, prefs] = await Promise.all([
        notificationsApi.getMyEmployee(),
        notificationsApi.getEmployeePreferences(),
      ]);
      setNotifications(Array.isArray(data) ? data : []);
      if (prefs) {
        setPreferences({
          mutedTypes: prefs.mutedTypes || [],
          mutedPriorities: prefs.mutedPriorities || [],
          muteAll: Boolean(prefs.muteAll),
          allowUrgentSound: prefs.allowUrgentSound !== false,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!preferences.allowUrgentSound) return;
    const urgentUnread = notifications.filter(
      (item) => item.priority === 'urgent' && item.status !== 'read'
    );
    const newUrgent = urgentUnread.find((item) => !urgentSeenRef.current.has(item.id));
    if (newUrgent) {
      urgentSeenRef.current.add(newUrgent.id);
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.08;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch {
        // ignore audio errors
      }
    }
  }, [notifications, preferences.allowUrgentSound]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read').length,
    [notifications]
  );
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((item) => item.type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (showUnreadOnly && item.status === 'read') return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      return true;
    });
  }, [notifications, filterType, showUnreadOnly]);

  const savePreferences = async (nextPreferences) => {
    setPreferences(nextPreferences);
    try {
      await notificationsApi.updateEmployeePreferences(nextPreferences);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update preferences.');
    }
  };

  const typeMeta = (type) => {
    switch (type) {
      case 'appointment':
        return { label: 'Appointment', icon: CalendarDays };
      case 'admission':
        return { label: 'Admission', icon: ClipboardList };
      case 'lab':
        return { label: 'Lab', icon: FlaskConical };
      case 'stock':
        return { label: 'Stock', icon: Pill };
      case 'pharmacy':
        return { label: 'Pharmacy', icon: Pill };
      case 'billing':
        return { label: 'Billing', icon: Activity };
      default:
        return { label: 'Alert', icon: BellRing };
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsApi.markReadEmployee(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, status: 'read', readAt: new Date().toISOString() } : item))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark notification.');
    }
  };

  const resolveNotificationRoute = (notification) => {
    const sourceType = notification.sourceType || notification.type;
    const sourceId = notification.sourceId;
    if (!sourceType || !sourceId) return null;

    if (sourceType === 'appointment') {
      if (role === 'doctor') return `/doctor/appointments?appointmentId=${sourceId}`;
      return `/employee/receptionist/queue?appointmentId=${sourceId}`;
    }
    if (sourceType === 'labOrder') {
      if (role === 'labTechnician') return `/employee/lab-technician/orders?orderId=${sourceId}`;
      if (role === 'doctor') return `/doctor/lab-orders?orderId=${sourceId}`;
      return `/employee/lab-orders/${sourceId}`;
    }
    if (sourceType === 'pharmacyOrder') {
      return `/employee/pharmacist/orders?orderId=${sourceId}`;
    }
    if (sourceType === 'invoice' || notification.type === 'billing') {
      return `/employee/billing?invoiceId=${sourceId}`;
    }
    if (sourceType === 'admission') {
      return `/employee/admissions?admissionId=${sourceId}`;
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

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllReadEmployee();
      setNotifications((current) =>
        current.map((item) => ({ ...item, status: 'read', readAt: new Date().toISOString() }))
      );
      await loadNotifications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to mark all notifications.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Notifications</h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unreadCount} unread
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showUnreadOnly ? 'default' : 'outline'}
            onClick={() => setShowUnreadOnly((current) => !current)}
          >
            {showUnreadOnly ? 'Showing unread' : 'Unread only'}
          </Button>
          <Button variant="outline" onClick={markAllRead} disabled={notifications.length === 0}>
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preferences</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">Notification controls</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose which alert types you want to see and whether urgent alerts trigger a sound.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={!preferences.muteAll}
              onChange={(event) =>
                savePreferences({
                  ...preferences,
                  muteAll: !event.target.checked,
                })
              }
            />
            Enable notifications
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {availableTypes
            .filter((type) => type !== 'all')
            .map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const muted = new Set(preferences.mutedTypes);
                  if (muted.has(type)) {
                    muted.delete(type);
                  } else {
                    muted.add(type);
                  }
                  savePreferences({ ...preferences, mutedTypes: Array.from(muted) });
                }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  preferences.mutedTypes.includes(type)
                    ? 'border-border text-muted-foreground'
                    : 'border-primary bg-primary/10 text-primary'
                }`}
              >
                {type}
              </button>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={preferences.allowUrgentSound}
              onChange={(event) =>
                savePreferences({
                  ...preferences,
                  allowUrgentSound: event.target.checked,
                })
              }
            />
            Play sound for urgent alerts
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={!preferences.mutedPriorities.includes('urgent')}
              onChange={(event) => {
                const muted = new Set(preferences.mutedPriorities);
                if (event.target.checked) {
                  muted.delete('urgent');
                } else {
                  muted.add('urgent');
                }
                savePreferences({ ...preferences, mutedPriorities: Array.from(muted) });
              }}
            />
            Show urgent alerts
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filterType === type
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {type === 'all' ? 'All notifications' : type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const meta = typeMeta(notification.type);
          const Icon = meta.icon;
          return (
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
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={notification.type}>{meta.label}</StatusBadge>
                  <StatusBadge status={notification.status}>{notification.status}</StatusBadge>
                  {notification.priority === 'urgent' && (
                    <StatusBadge status="urgent">
                      <span className="inline-flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> urgent
                      </span>
                    </StatusBadge>
                  )}
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
          );
        })}
        {!loading && filteredNotifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No notifications yet. You will see operational alerts here.
          </div>
        )}
      </div>
    </motion.section>
  );
}
