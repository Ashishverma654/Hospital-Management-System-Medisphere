import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  BarChart, Bar, 
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 40000, expenses: 24000 },
  { name: 'Feb', revenue: 30000, expenses: 13980 },
  { name: 'Mar', revenue: 20000, expenses: 9800 },
  { name: 'Apr', revenue: 27800, expenses: 3908 },
  { name: 'May', revenue: 18900, expenses: 4800 },
  { name: 'Jun', revenue: 23900, expenses: 3800 },
];

const patientDemo = [
  { name: 'Adults (18-64)', value: 500 },
  { name: 'Seniors (65+)', value: 300 },
  { name: 'Pediatrics (0-17)', value: 200 },
];
const COLORS = ['#2563EB', '#0EA5E9', '#22C55E'];

const departmentStats = [
  { name: 'Cardiology', patients: 145 },
  { name: 'Neurology', patients: 85 },
  { name: 'Pediatrics', patients: 120 },
  { name: 'Orthopedics', patients: 95 },
  { name: 'General', patients: 210 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
        <p className="text-muted-foreground">Comprehensive insights into hospital operations and financial health.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Revenue vs Expenses (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #88888833', backgroundColor: 'var(--background)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--color-secondary)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Department Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888833" />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #88888833', backgroundColor: 'var(--background)' }} />
                  <Bar dataKey="patients" name="Patients" fill="var(--color-secondary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[300px] w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={patientDemo}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {patientDemo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #88888833', backgroundColor: 'var(--background)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
