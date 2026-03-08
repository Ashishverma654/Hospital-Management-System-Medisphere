import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Printer, Plus, CreditCard, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { billingApi } from '../../services/apiServices';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

export default function Billing() {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'receptionist') {
      setLoading(false);
      setInvoices([]);
      return;
    }
    if (user?.role !== 'patient' || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    billingApi
      .getMy()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setInvoices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setInvoices([]);
        toast.error('Failed to load invoices');
      })
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const handlePay = (id) => {
    billingApi
      .pay(id, { paymentMethod: 'card' })
      .then(() => {
        toast.success('Payment recorded');
        setInvoices((prev) =>
          prev.map((inv) => (inv._id === id ? { ...inv, paymentStatus: 'paid' } : inv))
        );
      })
      .catch(() => toast.error('Payment failed'));
  };

  const totalRevenue = invoices.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const pending = invoices.filter((i) => i.paymentStatus !== 'paid');
  const pendingAmount = pending.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground">
            Manage patient billing, payments, and invoice generation.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'receptionist') && (
          <Button className="shadow-md shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Revenue (Paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{pending.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium text-primary">
                      {inv._id?.slice(-8) || inv.id || '—'}
                    </TableCell>
                    <TableCell>
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString()
                        : inv.date || '—'}
                    </TableCell>
                    <TableCell className="font-medium">${(inv.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}
                      >
                        {inv.paymentStatus || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" title="View details">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {inv.paymentStatus !== 'paid' &&
                        (user?.role === 'admin' || user?.role === 'receptionist') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Process Payment"
                            className="text-primary hover:text-primary"
                            onClick={() => handlePay(inv._id)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      <Button variant="ghost" size="icon" title="Print">
                        <Printer className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && invoices.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No invoices found.</div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
