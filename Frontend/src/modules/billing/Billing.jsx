import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Printer, Plus, CreditCard } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const invoices = [
  { id: 'INV-2023-001', patient: 'John Doe', date: '2023-10-24', amount: '$150.00', status: 'Paid' },
  { id: 'INV-2023-002', patient: 'Alice Johnson', date: '2023-10-23', amount: '$75.00', status: 'Pending' },
  { id: 'INV-2023-003', patient: 'Mark Davis', date: '2023-10-20', amount: '$450.00', status: 'Overdue' },
  { id: 'INV-2023-004', patient: 'Emma Wilson', date: '2023-10-18', amount: '$1,200.00', status: 'Paid' },
];

export default function Billing() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground">Manage patient billing, payments, and invoice generation.</p>
        </div>
        <Button className="shadow-md shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Total Revenue Today</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">$2,450.00</div>
           </CardContent>
         </Card>
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Pending Payments</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">$840.00</div>
           </CardContent>
         </Card>
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Overdue Invoices</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-destructive">4</div>
           </CardContent>
         </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Invoice ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-primary">{inv.id}</TableCell>
                  <TableCell>{inv.patient}</TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell className="font-medium">{inv.amount}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inv.status === 'Paid' ? 'bg-green-500/10 text-green-600' : 
                      inv.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-600' : 
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title="View details">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {inv.status !== 'Paid' && (
                      <Button variant="ghost" size="icon" title="Process Payment" className="text-primary hover:text-primary">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Download Print">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
