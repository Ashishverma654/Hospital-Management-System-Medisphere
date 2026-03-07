import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, AlertTriangle, Archive } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

const inventory = [
  { id: 'MED-001', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 450, unit: 'pills', status: 'In Stock' },
  { id: 'MED-002', name: 'Lisinopril 10mg', category: 'Antihypertensive', stock: 120, unit: 'pills', status: 'Low Stock' },
  { id: 'MED-003', name: 'Atorvastatin 20mg', category: 'Statin', stock: 0, unit: 'pills', status: 'Out of Stock' },
  { id: 'MED-004', name: 'Ibuprofen 400mg', category: 'NSAID', stock: 1200, unit: 'pills', status: 'In Stock' },
];

export default function Pharmacy() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pharmacy & Inventory</h2>
          <p className="text-muted-foreground">Monitor medical supplies and drug inventory levels.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="bg-background/50 backdrop-blur-sm">
            <Archive className="mr-2 h-4 w-4" /> Export Report
          </Button>
            <Button className="shadow-md shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Total Unique Items</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">428</div>
           </CardContent>
         </Card>
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Low Stock Alerts</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-yellow-500">12</div>
           </CardContent>
         </Card>
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Out of Stock</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-destructive">3</div>
           </CardContent>
         </Card>
         <Card className="bg-background/50 backdrop-blur-sm border-border/50">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm text-muted-foreground">Pending Orders</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">5</div>
           </CardContent>
         </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-primary">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <span className="font-medium">{item.stock}</span> <span className="text-muted-foreground text-xs">{item.unit}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center w-fit gap-1 ${
                      item.status === 'In Stock' ? 'bg-green-500/10 text-green-600' : 
                      item.status === 'Low Stock' ? 'bg-yellow-500/10 text-yellow-600' : 
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {item.status !== 'In Stock' && <AlertTriangle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">Update</Button>
                    {item.status !== 'In Stock' && (
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary">Order</Button>
                    )}
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
