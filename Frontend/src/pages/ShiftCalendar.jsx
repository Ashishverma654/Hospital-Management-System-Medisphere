import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import CalendarView from '../components/shifts/CalendarView.jsx';
import ShiftModal from '../components/shifts/ShiftModal.jsx';
import { adminApi, shiftApi } from '../services/apiServices.js';
import { createShift, deleteShift, getAllShifts, getMyShifts, updateShift, getShiftHistory } from '../services/shiftService.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { getRoleLabel } from '../auth/constants.js';

const ADMIN_ROLES = ['superadmin', 'admin', 'subadmin'];

const normalizeShiftType = (value) =>
  typeof value === 'string' ? value.toLowerCase() : '';

const deriveScheduleShiftType = (shift) => {
  const rawType = normalizeShiftType(shift?.shiftType);
  if (['morning', 'evening', 'night'].includes(rawType)) return rawType;
  const name = normalizeShiftType(shift?.name);
  if (name.includes('morning')) return 'morning';
  if (name.includes('evening') || name.includes('afternoon')) return 'evening';
  if (name.includes('night')) return 'night';
  const start = shift?.startTime;
  if (typeof start === 'string' && start.includes(':')) {
    const [h, m] = start.split(':').map(Number);
    if (!Number.isNaN(h)) {
      const minutes = h * 60 + (Number.isNaN(m) ? 0 : m);
      if (minutes >= 300 && minutes < 720) return 'morning';
      if (minutes >= 720 && minutes < 1080) return 'evening';
      return 'night';
    }
  }
  return 'morning';
};

const toEvent = (shift, staffNameMap = new Map(), currentUser = null) => {
  const userId =
    shift.userId?._id ||
    shift.userId?.id ||
    shift.userId ||
    shift.userIdId ||
    shift.user;
  const staffName =
    shift.userId?.name ||
    staffNameMap.get(String(userId)) ||
    (currentUser && (currentUser.id === userId || currentUser._id === userId) ? currentUser.name : null) ||
    shift.userId?.email ||
    'Staff';
  const shiftType = shift.shiftType || shift.scheduleShiftType || 'morning';
  return {
    id: shift._id || shift.id,
    title: `${staffName} (${shiftType})`,
    start: new Date(shift.startTime),
    end: new Date(shift.endTime),
    resource: {
      ...shift,
      userId: shift.userId?.name ? shift.userId : { _id: userId, name: staffName },
    },
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
  const restrictDoctorForSubadmin = user?.role === 'subadmin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [range, setRange] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({ date: '', role: '' });
  const [calendarView, setCalendarView] = useState('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const staffNameMap = useMemo(
    () => new Map(staffOptions.map((staff) => [String(staff.id), staff.name])),
    [staffOptions]
  );

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
      setEvents(items.map((item) => toEvent(item, staffNameMap, user)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, range, staffNameMap]);

  useEffect(() => {
    if (!staffOptions.length) return;
    setEvents((current) =>
      current.map((event) => {
        const eventUserId = event.resource?.userId?._id || event.resource?.userId;
        const resolvedName = staffNameMap.get(String(eventUserId));
        if (!resolvedName) return event;
        const shiftType = event.resource?.shiftType || event.resource?.scheduleShiftType || 'morning';
        return {
          ...event,
          title: `${resolvedName} (${shiftType})`,
          resource: {
            ...event.resource,
            userId: { _id: eventUserId, name: resolvedName },
          },
        };
      })
    );
  }, [staffOptions, staffNameMap]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadStaff = async () => {
      try {
        const data = await adminApi.getAllUsers({ limit: 200, isActive: true });
        const users = data?.users || [];
        const filtered = users.filter((staff) => {
          if (!staff.role || staff.role === 'patient') return false;
          if (restrictDoctorForSubadmin && staff.role === 'doctor') return false;
          return true;
        });
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
  }, [isAdmin, restrictDoctorForSubadmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadShiftTemplates = async () => {
      try {
        const data = await shiftApi.getAll({ isActive: true, page: 1, limit: 100 });
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const mapped = items.map((shift) => ({
          ...shift,
          scheduleShiftType: deriveScheduleShiftType(shift),
        }));
        setShiftTemplates(mapped);
      } catch {
        setShiftTemplates([]);
      }
    };
    loadShiftTemplates();
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
      const endOfDay = end ? new Date(end) : end;
      if (endOfDay) endOfDay.setHours(23, 59, 59, 999);
      setRange({ start, end: endOfDay });
    } else if (rangeValue?.start && rangeValue?.end) {
      const endOfDay = new Date(rangeValue.end);
      endOfDay.setHours(23, 59, 59, 999);
      setRange({ start: rangeValue.start, end: endOfDay });
    }
  };

  const hasOverlap = ({ start, end, userId, excludeId }) =>
    events.some((event) => {
      const eventUserId = event.resource?.userId?._id || event.resource?.userId;
      if (userId && eventUserId !== userId) return false;
      if (excludeId && event.id === excludeId) return false;
      return start < event.end && end > event.start;
    });

  // normalizeShiftType and deriveScheduleShiftType moved to module scope.

  const getShiftTemplateByType = (type) => {
    const normalizedType = normalizeShiftType(type);
    return (
      shiftTemplates.find(
        (shift) =>
          normalizeShiftType(shift.scheduleShiftType || shift.shiftType) === normalizedType &&
          shift.isActive !== false
      )
      || shiftTemplates.find((shift) =>
        normalizeShiftType(shift.scheduleShiftType || shift.shiftType) === normalizedType
      )
    );
  };

  const getShiftTemplateById = (id) =>
    shiftTemplates.find((shift) => shift._id === id);

  const isPastDate = (date) => {
    if (!date) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return date < startOfToday;
  };

  const pickShiftTemplateForSlot = (slotInfo) => {
    if (!slotInfo?.start || !shiftTemplates.length) return null;
    const slotMinutes = slotInfo.start.getHours() * 60 + slotInfo.start.getMinutes();
    for (const template of shiftTemplates) {
      if (!template?.startTime || !template?.endTime) continue;
      const [startHour, startMinute] = template.startTime.split(':').map(Number);
      const [endHour, endMinute] = template.endTime.split(':').map(Number);
      if (Number.isNaN(startHour) || Number.isNaN(endHour)) continue;
      const startMinutes = startHour * 60 + (startMinute || 0);
      const endMinutes = endHour * 60 + (endMinute || 0);
      if (endMinutes > startMinutes) {
        if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
          return template;
        }
      } else {
        if (slotMinutes >= startMinutes || slotMinutes < endMinutes) {
          return template;
        }
      }
    }
    return null;
  };

  const openCreateModal = (slotInfo) => {
    if (isPastDate(slotInfo?.start)) {
      toast.error('Cannot create shifts for past dates.');
      return;
    }
    const suggestedTemplate = pickShiftTemplateForSlot(slotInfo);
    setActiveEvent({
      start: slotInfo.start,
      end: slotInfo.end,
      resource: suggestedTemplate
        ? {
            shiftType: suggestedTemplate.scheduleShiftType || normalizeShiftType(suggestedTemplate.shiftType),
            shiftTemplateId: suggestedTemplate._id,
          }
        : {},
    });
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    const eventStart = event?.start || event?.resource?.startTime;
    if (isPastDate(eventStart)) {
      toast.error('Past shifts cannot be edited.');
      return;
    }
    setActiveEvent(event);
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    const shiftTemplate =
      getShiftTemplateById(form.shiftTemplateId)
      || getShiftTemplateByType(form.shiftType);
    if (!shiftTemplate) {
      return toast.error('Shift timings are missing. Configure shift timings in Shift Management.');
    }
    const startDateTime = buildDateTime(form.date, shiftTemplate.startTime);
    const endDateTime = buildDateTime(form.date, shiftTemplate.endTime);
    const normalized = normalizeShiftWindow({ startTime: startDateTime, endTime: endDateTime });

    if (!form.userId) return toast.error('Select a staff member.');
    if (!form.shiftType) return toast.error('Select a shift type.');
    if (!normalized) return toast.error('Invalid start or end time.');

    const start = normalized.start;
    const end = normalized.end;
    if (isPastDate(start)) {
      return toast.error(activeEvent?.id ? 'Cannot edit shifts in the past.' : 'Cannot create shifts for past dates.');
    }
    if (hasOverlap({ start, end, userId: form.userId, excludeId: activeEvent?.id })) {
      return toast.error('Shift overlaps with another schedule for this staff.');
    }

    const finalShiftType = deriveScheduleShiftType(shiftTemplate);
    if (!['morning', 'evening', 'night'].includes(finalShiftType)) {
      return toast.error('Shift type must be morning, evening, or night. Update Shift Management timings.');
    }

    const payload = {
      userId: form.userId,
      role: form.role,
      shiftType: finalShiftType,
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
        const days = Array.isArray(form.days) ? form.days : [];
        if (days.length && form.date) {
          const base = new Date(form.date);
          const weekStart = new Date(base);
          weekStart.setDate(base.getDate() - base.getDay());
          const createdEvents = [];
          for (const day of days) {
            const targetDate = new Date(weekStart);
            targetDate.setDate(weekStart.getDate() + day);
            if (isPastDate(targetDate)) {
              continue;
            }
            const dateString = targetDate.toISOString().split('T')[0];
            const dayStart = buildDateTime(dateString, shiftTemplate.startTime);
            const dayEnd = buildDateTime(dateString, shiftTemplate.endTime);
            const normalizedWindow = normalizeShiftWindow({ startTime: dayStart, endTime: dayEnd });
            if (!normalizedWindow) continue;
            if (hasOverlap({ start: normalizedWindow.start, end: normalizedWindow.end, userId: form.userId })) {
              continue;
            }
            const response = await createShift({
              ...payload,
              startTime: normalizedWindow.start.toISOString(),
              endTime: normalizedWindow.end.toISOString(),
            });
            if (response) createdEvents.push(toEvent(response, staffNameMap, user));
          }
          if (createdEvents.length) {
            setEvents((current) => [...current, ...createdEvents]);
            toast.success(`Created ${createdEvents.length} shifts.`);
          } else {
            toast.error('No shifts created. Check for overlaps or past dates.');
          }
        } else {
          const response = await createShift(payload);
          const created = response;
          if (created) {
            setEvents((current) => [...current, toEvent(created, staffNameMap, user)]);
          }
          toast.success('Shift created.');
        }
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
    if (isPastDate(start)) {
      toast.error('Cannot move shifts to past dates.');
      return;
    }
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
    if (isPastDate(start)) {
      toast.error('Cannot move shifts to past dates.');
      return;
    }
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
        shiftTemplates={shiftTemplates}
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
