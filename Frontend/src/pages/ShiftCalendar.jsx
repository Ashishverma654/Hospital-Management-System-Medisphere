import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import CalendarView from '../components/shifts/CalendarView.jsx';
import ShiftModal from '../components/shifts/ShiftModal.jsx';
import { adminApi } from '../services/apiServices.js';
import { createShift, deleteShift, getAllShifts, getMyShifts, updateShift, getShiftHistory } from '../services/shiftService.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { getRoleLabel } from '../auth/constants.js';

const ADMIN_ROLES = ['superadmin', 'admin', 'subadmin'];

const toEvent = (shift) => {
  const staffName = shift.userId?.name || 'Staff';
  const shiftType = shift.shiftType || 'morning';
  return {
    id: shift._id || shift.id,
    title: `${staffName} (${shiftType})`,
    start: new Date(shift.startTime),
    end: new Date(shift.endTime),
    resource: shift,
  };
};

const buildDateTime = (date, time) => {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00`);
};

const normalizeShiftWindow = ({ startTime, endTime }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end <= start) {
    const adjusted = new Date(end);
    adjusted.setDate(adjusted.getDate() + 1);
    return { start, end: adjusted };
  }
  return { start, end };
};

export default function ShiftCalendar() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [range, setRange] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ date: '', role: '' });
  const [calendarView, setCalendarView] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const params = range
        ? { start: range.start?.toISOString(), end: range.end?.toISOString() }
        : undefined;
      const response = isAdmin ? await getAllShifts(params) : await getMyShifts(params);
      const items = Array.isArray(response)
        ? response
        : response?.items || response?.data || [];
      setEvents(items.map(toEvent));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, range]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadStaff = async () => {
      try {
        const data = await adminApi.getAllUsers({ limit: 200, isActive: true });
        const users = data?.users || [];
        const filtered = users.filter((staff) => staff.role && staff.role !== 'patient');
        setStaffOptions(
          filtered.map((staff) => ({
            id: staff._id,
            name: staff.name || staff.email,
            role: staff.role,
            roleLabel: getRoleLabel(staff.role),
          }))
        );
      } catch {
        setStaffOptions([]);
      }
    };
    loadStaff();
  }, [isAdmin]);

  const loadHistory = useCallback(async () => {
    if (!historyOpen || !isAdmin) return;
    try {
      const params = {};
      if (historyFilters.date) params.date = historyFilters.date;
      if (historyFilters.role) params.role = historyFilters.role;
      const data = await getShiftHistory(params);
      setHistoryLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load shift history.');
    }
  }, [historyOpen, historyFilters, isAdmin]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRangeChange = (rangeValue) => {
    if (Array.isArray(rangeValue)) {
      const start = rangeValue[0];
      const end = rangeValue[rangeValue.length - 1];
      setRange({ start, end });
    } else if (rangeValue?.start && rangeValue?.end) {
      setRange({ start: rangeValue.start, end: rangeValue.end });
    }
  };

  const hasOverlap = ({ start, end, userId, excludeId }) =>
    events.some((event) => {
      const eventUserId = event.resource?.userId?._id || event.resource?.userId;
      if (userId && eventUserId !== userId) return false;
      if (excludeId && event.id === excludeId) return false;
      return start < event.end && end > event.start;
    });

  const openCreateModal = (slotInfo) => {
    setActiveEvent({
      start: slotInfo.start,
      end: slotInfo.end,
      resource: {},
    });
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setActiveEvent(event);
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    const startDateTime = buildDateTime(form.date, form.startTime);
    const endDateTime = buildDateTime(form.date, form.endTime);
    const normalized = normalizeShiftWindow({ startTime: startDateTime, endTime: endDateTime });

    if (!form.userId) return toast.error('Select a staff member.');
    if (!form.shiftType) return toast.error('Select a shift type.');
    if (!normalized) return toast.error('Invalid start or end time.');

    const start = normalized.start;
    const end = normalized.end;
    if (hasOverlap({ start, end, userId: form.userId, excludeId: activeEvent?.id })) {
      return toast.error('Shift overlaps with another schedule for this staff.');
    }

    const payload = {
      userId: form.userId,
      role: form.role,
      shiftType: form.shiftType,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    const staffName =
      staffOptions.find((staff) => staff.id === form.userId)?.name
      || activeEvent?.resource?.userId?.name
      || 'Staff';

    setSaving(true);
    let previousEvents = null;
    try {
      if (activeEvent?.id) {
        previousEvents = events;
        setEvents((current) =>
          current.map((event) =>
            event.id === activeEvent.id
              ? {
                  ...event,
                  start,
                  end,
                  title: `${staffName} (${form.shiftType})`,
                  resource: { ...event.resource, ...payload },
                }
              : event
          )
        );
        await updateShift(activeEvent.id, payload);
        toast.success('Shift updated.');
      } else {
        const response = await createShift(payload);
        const created = response;
        if (created) {
          setEvents((current) => [...current, toEvent(created)]);
        }
        toast.success('Shift created.');
      }
      setModalOpen(false);
      setActiveEvent(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save shift.');
      if (previousEvents) setEvents(previousEvents);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeEvent?.id) return;
    setSaving(true);
    const previous = events;
    setEvents((current) => current.filter((event) => event.id !== activeEvent.id));
    try {
      await deleteShift(activeEvent.id);
      toast.success('Shift deleted.');
      setModalOpen(false);
      setActiveEvent(null);
    } catch (error) {
      setEvents(previous);
      toast.error(error.response?.data?.message || 'Unable to delete shift.');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    const eventUserId = event.resource?.userId?._id || event.resource?.userId;
    if (hasOverlap({ start, end, userId: eventUserId, excludeId: event.id })) {
      toast.error('Shift overlaps with another schedule for this staff.');
      return;
    }

    const previous = events;
    setEvents((current) => current.map((item) => (item.id === event.id ? updatedEvent : item)));
    try {
      await updateShift(event.id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    } catch (error) {
      setEvents(previous);
      toast.error(error.response?.data?.message || 'Unable to update shift.');
    }
  };

  const handleResize = async ({ event, start, end }) => {
    const updatedEvent = { ...event, start, end };
    const eventUserId = event.resource?.userId?._id || event.resource?.userId;
    if (hasOverlap({ start, end, userId: eventUserId, excludeId: event.id })) {
      toast.error('Shift overlaps with another schedule for this staff.');
      return;
    }

    const previous = events;
    setEvents((current) => current.map((item) => (item.id === event.id ? updatedEvent : item)));
    try {
      await updateShift(event.id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
    } catch (error) {
      setEvents(previous);
      toast.error(error.response?.data?.message || 'Unable to update shift.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Shift Calendar</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Staff scheduling</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {isAdmin
                ? 'Drag, resize, and assign shifts for hospital teams.'
                : 'View your upcoming shift schedule.'}
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              History
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading shifts...
        </div>
      )}

      {!loading && (
        <CalendarView
          events={events}
          onSelectSlot={openCreateModal}
          onSelectEvent={openEditModal}
          onEventDrop={handleDrop}
          onEventResize={handleResize}
          canEdit={isAdmin}
          onRangeChange={handleRangeChange}
          view={calendarView}
          date={calendarDate}
          onViewChange={setCalendarView}
          onDateChange={setCalendarDate}
        />
      )}

      <ShiftModal
        key={`${activeEvent?.id || activeEvent?.start?.toISOString?.() || 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        eventData={activeEvent}
        canEdit={isAdmin}
        staffOptions={staffOptions}
        saving={saving}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Shift History</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</span>
              <Input
                type="date"
                value={historyFilters.date}
                onChange={(event) => setHistoryFilters((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</span>
              <Select
                value={historyFilters.role}
                onValueChange={(value) => setHistoryFilters((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {['superadmin', 'admin', 'subadmin'].map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-muted-foreground" colSpan={4}>
                      No history entries found.
                    </td>
                  </tr>
                )}
                {historyLogs.map((log) => (
                  <tr key={log._id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.actorName || 'System'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{getRoleLabel(log.actorRole || 'system')}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
