import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getRoleLabel } from '../../auth/constants.js';

const pad = (value) => String(value).padStart(2, '0');

const toDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const normalizeShiftType = (value) =>
  typeof value === 'string' ? value.toLowerCase() : '';

export default function ShiftModal({
  open,
  onClose,
  onSave,
  onDelete,
  eventData,
  canEdit,
  staffOptions = [],
  shiftTemplates = [],
  saving,
}) {
  const shiftOptions = useMemo(
    () =>
      shiftTemplates
        .filter((shift) => shift.shiftType || shift.scheduleShiftType)
        .map((shift) => ({
          ...shift,
          shiftTypeNormalized: normalizeShiftType(shift.scheduleShiftType || shift.shiftType),
        })),
    [shiftTemplates]
  );

  const defaultTemplate = shiftOptions[0];

  const resolveTemplateById = (templateId) =>
    shiftOptions.find((option) => option._id === templateId);

  const resolveTemplateByTiming = (shiftType, startValue, endValue) =>
    shiftOptions.find(
      (option) =>
        option.shiftTypeNormalized === shiftType &&
        option.startTime === startValue &&
        option.endTime === endValue
    );

  const buildInitialForm = () => {
    const templateFallback = defaultTemplate;
    if (!eventData) {
      const template = templateFallback;
      return {
        userId: '',
        role: '',
        shiftType: template?.shiftTypeNormalized || 'morning',
        shiftTemplateId: template?._id || '',
        date: '',
        days: [],
        startTime: template?.startTime || '',
        endTime: template?.endTime || '',
      };
    }

    const resource = eventData.resource || {};
    const fallbackType = normalizeShiftType(resource.shiftType) || templateFallback?.shiftTypeNormalized || 'morning';
    const fallbackStart = toTimeInput(eventData.start || resource.startTime);
    const fallbackEnd = toTimeInput(eventData.end || resource.endTime);
    const template =
      resolveTemplateById(resource.shiftTemplateId)
      || resolveTemplateByTiming(fallbackType, fallbackStart, fallbackEnd)
      || shiftOptions.find((option) => option.shiftTypeNormalized === fallbackType);
    return {
      userId: resource.userId?._id || resource.userId || '',
      role: resource.role || '',
      shiftType: fallbackType,
      shiftTemplateId: template?._id || '',
      date: toDateInput(eventData.start || resource.startTime),
      days: [],
      startTime: template?.startTime || fallbackStart,
      endTime: template?.endTime || fallbackEnd,
    };
  };

  const [form, setForm] = useState(() => buildInitialForm());

  const selectedStaff = useMemo(
    () => staffOptions.find((staff) => staff.id === form.userId),
    [staffOptions, form.userId]
  );
  const roleOptions = useMemo(() => {
    const roles = new Set(
      staffOptions
        .map((staff) => staff.role)
        .filter((role) => role && role !== 'doctor')
    );
    return Array.from(roles);
  }, [staffOptions]);
  const [roleFilter, setRoleFilter] = useState('');

  const filteredStaffOptions = roleFilter
    ? staffOptions.filter((staff) => staff.role === roleFilter)
    : staffOptions;
  const derivedRole = selectedStaff?.role || form.role || eventData?.resource?.role || '';

  const handleSave = () => {
    onSave({ ...form, role: derivedRole });
  };

  const staffDisabled = !canEdit || staffOptions.length === 0;
  const handleOpenChange = (value) => {
    if (!value) {
      onClose();
      return;
    }
    setForm(buildInitialForm());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {eventData?.id ? 'Edit Shift' : 'Create Shift'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {canEdit && (
            <div className="grid gap-2">
              <Label>Filter by Role</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Staff</Label>
            {canEdit ? (
              <Select
                value={form.userId}
                onValueChange={(value) => setForm((current) => ({ ...current, userId: value }))}
                disabled={staffDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedStaff?.name || (staffDisabled ? 'Staff locked' : 'Select staff')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredStaffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} • {staff.roleLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={selectedStaff?.name || eventData?.resource?.userId?.name || 'Staff'} disabled />
            )}
          </div>

          <div className="grid gap-2">
            <Label>Role</Label>
            <Input value={derivedRole ? getRoleLabel(derivedRole) : ''} disabled />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                min={toDateInput(new Date())}
                disabled={!canEdit}
              />
            </div>
            {canEdit && !eventData?.id && (
              <div className="grid gap-2">
                <Label>Days (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Mon', value: 1 },
                    { label: 'Tue', value: 2 },
                    { label: 'Wed', value: 3 },
                    { label: 'Thu', value: 4 },
                    { label: 'Fri', value: 5 },
                    { label: 'Sat', value: 6 },
                    { label: 'Sun', value: 0 },
                  ].map((day) => {
                    const selected = form.days.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            days: selected
                              ? current.days.filter((value) => value !== day.value)
                              : [...current.days, day.value],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select multiple days to create shifts for this week only.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Shift Type</Label>
            <Select
              value={form.shiftTemplateId || ''}
              onValueChange={(value) => {
                const template = resolveTemplateById(value);
                setForm((current) => ({
                  ...current,
                  shiftType: template?.shiftTypeNormalized || current.shiftType,
                  shiftTemplateId: value,
                  startTime: template?.startTime || current.startTime,
                  endTime: template?.endTime || current.endTime,
                }));
              }}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue>
                  {resolveTemplateById(form.shiftTemplateId)?.name || form.shiftType || 'Select shift type'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {shiftOptions.length === 0 && (
                  <SelectItem value="none" disabled>
                    No shifts configured
                  </SelectItem>
                )}
                {shiftOptions.map((option) => (
                  <SelectItem key={option._id} value={option._id}>
                    {option.name || option.shiftType} ({option.startTime} - {option.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.startTime}
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.endTime}
                disabled
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-wrap justify-between gap-2">
          {canEdit && eventData?.id && (
            <Button variant="destructive" onClick={onDelete} disabled={saving}>
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Close
            </Button>
            {canEdit && (
              <Button onClick={handleSave} disabled={saving}>
                Save
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
