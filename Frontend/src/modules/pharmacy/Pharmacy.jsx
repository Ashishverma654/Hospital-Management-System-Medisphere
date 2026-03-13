import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, AlertTriangle, Archive, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { pharmacyApi } from '../../services/apiServices';
import { toast } from 'sonner';
import { FormDialog } from '../../components/FormDialog';

export default function Pharmacy() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    pharmacyApi
      .getAll()
      .then((res) => {
        setInventory(Array.isArray(res) ? res : []);
      })
      .catch(() => toast.error('Failed to load medicines'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Item ID,Name,Category,Stock Level"].join(",") + "\n"
      + inventory.map(item => `${item._id},${item.name || ''},${item.category || ''},${item.stock || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pharmacy_inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory exported securely.");
  };

  const handleSubmit = async (formData) => {
    try {
      await pharmacyApi.add({
        ...formData,
        stock: parseInt(formData.stock)
      });
      toast.success('Medicine added successfully!');
      setShowForm(false);
      fetchInventory();
    } catch (_err) {
      toast.error('Failed to add medicine');
    }
  };

  const fields = [
    { name: 'name', label: 'Medication Name', required: true, placeholder: 'e.g., Paracetamol' },
    { name: 'category', label: 'Category', required: true, placeholder: 'e.g., Painkiller' },
    { name: 'stock', label: 'Initial Stock', required: true, type: 'number' },
  ];

  const total = inventory.length;
  const lowStock = inventory.filter((i) => (i.stock ?? 0) > 0 && (i.stock ?? 0) < 50).length;
  const outOfStock = inventory.filter((i) => (i.stock ?? 0) === 0).length;

  const getStatus = (item) => {
    const s = item.stock ?? 0;
    if (s === 0) return 'Out of Stock';
    if (s < 50) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pharmacy & Inventory</h2>
          <p className="text-muted-foreground">
            Monitor medical supplies and drug inventory levels.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-background/50 backdrop-blur-sm" onClick={handleExport}>
            <Archive className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button className="shadow-md shadow-primary/20" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Unique Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{lowStock}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{outOfStock}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">In Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{total - outOfStock}</div>
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
                  <TableHead className="w-[120px]">Item ID</TableHead>
                  <TableHead>Medication Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const status = getStatus(item);
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium text-primary">
                        {item._id?.slice(-8) || item.id || '—'}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category || '—'}</TableCell>
                      <TableCell>
                        <span className="font-medium">{item.stock ?? 0}</span>{' '}
                        <span className="text-muted-foreground text-xs">units</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded-full flex items-center w-fit gap-1 ${
                            status === 'In Stock'
                              ? 'bg-green-500/10 text-green-600'
                              : status === 'Low Stock'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {status !== 'In Stock' && <AlertTriangle className="w-3 h-3" />}
                          {status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm">
                          Update
                        </Button>
                        {status !== 'In Stock' && (
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                            Order
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!loading && inventory.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No medicines in inventory.</div>
          )}
        </div>
      </Card>
      
      <FormDialog
        isOpen={showForm}
        title="Add Medication"
        fields={fields}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
      />
    </motion.div>
  );
}
