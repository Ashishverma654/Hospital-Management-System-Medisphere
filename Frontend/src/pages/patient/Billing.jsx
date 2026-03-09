import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DataTable, LoadingSkeleton, ErrorState, StatusBadge } from '../../components';
import { billingApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { DollarSign, Download, CheckCircle } from 'lucide-react';

export default function PatientBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingApi.getMy();
      setInvoices(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (invoiceId) => {
    try {
      await billingApi.pay(invoiceId, { paymentMethod: 'card' });
      toast.success('Payment processed successfully');
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const calculateTotals = () => {
    const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paid = invoices
      .filter((inv) => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pending = invoices
      .filter((inv) => inv.paymentStatus === 'pending')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return { total, paid, pending };
  };

  const totals = calculateTotals();

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
    },
    {
      key: 'appointmentId',
      label: 'Date',
      render: (apt) => apt?.date ? new Date(apt.date).toLocaleDateString() : 'N/A',
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (amount) => `₹${amount?.toFixed(2) || '0.00'}`,
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (status) => <StatusBadge status={status === 'paid' ? 'completed' : 'pending'} />,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.paymentStatus === 'pending' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => handlePayment(row._id)}
              className="text-xs"
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Pay Now
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedInvoice(row)}
            className="text-xs"
          >
            <Download className="h-4 w-4 mr-1" /> View
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Billing</h2>
        <p className="text-muted-foreground">View and manage your invoices and payments</p>
      </div>

      {error && <ErrorState error={error} />}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.paymentStatus === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.paid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.filter((i) => i.paymentStatus === 'paid').length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.length} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No invoices found.
            </p>
          ) : (
            <DataTable
              data={invoices}
              columns={columns}
              searchPlaceholder="Search invoices..."
              searchKey="invoiceNumber"
            />
          )}
        </CardContent>
      </Card>

      {/* Invoice Details */}
      {selectedInvoice && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Invoice Details - {selectedInvoice.invoiceNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{selectedInvoice.paymentStatus}</p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="space-y-2">
                {selectedInvoice.doctorFee && (
                  <div className="flex justify-between">
                    <span>Doctor Consultation Fee</span>
                    <span>₹{selectedInvoice.doctorFee.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.labCharges && (
                  <div className="flex justify-between">
                    <span>Lab Charges</span>
                    <span>₹{selectedInvoice.labCharges.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.medicineCharges && (
                  <div className="flex justify-between">
                    <span>Medicine Charges</span>
                    <span>₹{selectedInvoice.medicineCharges.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.otherCharges && (
                  <div className="flex justify-between">
                    <span>Other Charges</span>
                    <span>₹{selectedInvoice.otherCharges.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 mt-4 pt-4 flex justify-between font-bold">
                <span>Total Amount</span>
                <span>₹{selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedInvoice.paymentStatus === 'pending' && (
                <Button
                  onClick={() => {
                    handlePayment(selectedInvoice._id);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 shadow-md shadow-primary/20"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Pay Now
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
