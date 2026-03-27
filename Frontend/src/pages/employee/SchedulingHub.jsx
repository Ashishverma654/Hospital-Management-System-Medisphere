import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import ShiftCalendar from '../ShiftCalendar.jsx';
import ShiftManagement from '../admin/ShiftManagement.jsx';
import NurseDutyAllocation from '../admin/NurseDutyAllocation.jsx';

const TABS = [
  { value: 'calendar', label: 'Shift Calendar' },
  { value: 'templates', label: 'Shift Templates' },
  { value: 'duty', label: 'Duty Allocation' },
];

export default function SchedulingHub() {
  const [tab, setTab] = useState('calendar');

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Scheduling</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Manage shifts and coverage</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Use one workspace to configure shift templates, assign schedules on the calendar, and allocate duty coverage.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0">
          {TABS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendar">
          <ShiftCalendar />
        </TabsContent>
        <TabsContent value="templates">
          <ShiftManagement />
        </TabsContent>
        <TabsContent value="duty">
          <NurseDutyAllocation />
        </TabsContent>
      </Tabs>
    </section>
  );
}
