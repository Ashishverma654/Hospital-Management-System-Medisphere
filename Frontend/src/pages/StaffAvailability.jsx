import { useEffect, useMemo, useState } from 'react';
import { staffAvailabilityApi } from '../services/apiServices.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { getRoleLabel } from '../auth/constants.js';

const STATUS_BADGE_STYLES = {
  Available: 'bg-primary/15 text-primary',
  'Off Duty': 'bg-muted text-muted-foreground',
  'On Leave': 'bg-destructive/15 text-destructive',
  Scheduled: 'bg-secondary/15 text-secondary-foreground',
};

const formatTimeRange = (start, end) => {
  if (!start || !end) return '—';
  const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
};

export default function StaffAvailability() {
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ role: 'all', department: 'all', shiftType: 'all' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, staffData] = await Promise.all([
        staffAvailabilityApi.getSummary(),
        staffAvailabilityApi.getAll(),
      ]);
      setSummary(summaryData);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load staff availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const roles = useMemo(() => {
    const roleSet = new Set(staff.map((item) => item.role).filter(Boolean));
    return ['all', ...Array.from(roleSet)];
  }, [staff]);

  const departments = useMemo(() => {
    const deptSet = new Set(
      staff.map((item) => item.department || 'Unassigned')
    );
    return ['all', ...Array.from(deptSet)];
  }, [staff]);

  const shifts = useMemo(() => {
    const shiftSet = new Set(['morning', 'evening', 'night']);
    staff.map((item) => item.shiftType).filter(Boolean).forEach((value) => shiftSet.add(value));
    return ['all', ...Array.from(shiftSet)];
  }, [staff]);

  const filteredStaff = staff.filter((item) => {
    const department = item.department || 'Unassigned';
    if (filters.role !== 'all' && item.role !== filters.role) return false;
    if (filters.department !== 'all' && department !== filters.department) return false;
    if (filters.shiftType !== 'all' && item.shiftType !== filters.shiftType) return false;
    return true;
  });

  return (
    <section className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Staff Availability</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time view of who is available, off duty, or scheduled today.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Available Now', value: summary?.available ?? 0, variant: 'Available' },
          { label: 'Off Duty', value: summary?.offDuty ?? 0, variant: 'Off Duty' },
          { label: 'On Leave', value: summary?.onLeave ?? 0, variant: 'On Leave' },
          { label: 'Scheduled', value: summary?.scheduled ?? 0, variant: 'Scheduled' },
        ].map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
              <Badge className={`mt-3 ${STATUS_BADGE_STYLES[card.variant]}`}>{card.variant}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</span>
            <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === 'all' ? 'All Roles' : getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Department</span>
            <Select
              value={filters.department}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, department: value }))}
            >
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shift</span>
            <Select
              value={filters.shiftType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, shiftType: value }))}
            >
              <SelectTrigger className="w-full min-w-[200px]">
                <SelectValue placeholder="All shifts" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {shifts.map((shift) => (
                  <SelectItem key={shift} value={shift}>
                    {shift === 'all' ? 'All Shifts' : shift}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {loading && <p className="text-sm text-muted-foreground">Loading staff availability...</p>}
          {!loading && filteredStaff.length === 0 && (
            <p className="text-sm text-muted-foreground">No staff matched the current filters.</p>
          )}
          {!loading && filteredStaff.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-3">S.No</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Shift Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((item, index) => (
                    <tr key={item.userId} className="border-t border-border">
                      <td className="py-3 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 font-semibold text-foreground">{item.name || item.email || 'Staff'}</td>
                      <td className="py-3 text-muted-foreground">{getRoleLabel(item.role)}</td>
                      <td className="py-3 text-muted-foreground">{item.department || 'Unassigned'}</td>
                      <td className="py-3">
                        <Badge className={STATUS_BADGE_STYLES[item.status] || STATUS_BADGE_STYLES['Off Duty']}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatTimeRange(item.shiftStart, item.shiftEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
