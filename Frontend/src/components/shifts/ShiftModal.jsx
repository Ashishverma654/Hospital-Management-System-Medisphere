import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getRoleLabel } from '../../auth/constants.js';

const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

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

export default function ShiftModal({
  open,
  onClose,
  onSave,
  onDelete,
  eventData,
  canEdit,
  staffOptions = [],
  saving,
}) {
  const initialForm = useMemo(() => {
    if (!eventData) {
      return {
        userId: '',
        role: '',
        shiftType: 'morning',
        date: '',
        startTime: '',
        endTime: '',
      };
    }

    const resource = eventData.resource || {};
    return {
      userId: resource.userId?._id || resource.userId || '',
      role: resource.role || '',
      shiftType: resource.shiftType || 'morning',
      date: toDateInput(eventData.start || resource.startTime),
      startTime: toTimeInput(eventData.start || resource.startTime),
      endTime: toTimeInput(eventData.end || resource.endTime),
    };
  }, [eventData]);

  const [form, setForm] = useState(initialForm);

  const selectedStaff = useMemo(
    () => staffOptions.find((staff) => staff.id === form.userId),
    [staffOptions, form.userId]
  );
  const roleOptions = useMemo(() => {
    const roles = new Set(staffOptions.map((staff) => staff.role).filter(Boolean));
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

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
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
                <SelectTrigger>
                  <SelectValue placeholder={staffDisabled ? 'Staff locked' : 'Select staff'} />
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

          <div className="grid gap-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label>Shift Type</Label>
            <Select
              value={form.shiftType}
              onValueChange={(value) => setForm((current) => ({ ...current, shiftType: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift type" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                disabled={!canEdit}
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
