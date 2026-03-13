import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Bed, Loader2, UserCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { bedApi } from '../../services/apiServices';
import { toast } from 'sonner';

export default function Beds() {
  const MotionDiv = motion.div;
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBeds = () => {
    setLoading(true);
    bedApi
      .getAll()
      .then((res) => {
        setBeds(Array.isArray(res) ? res : []);
      })
      .catch(() => toast.error('Failed to load beds'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => loadBeds(), []);

  const available = beds.filter((b) => b.status !== 'occupied').length;
  const occupied = beds.filter((b) => b.status === 'occupied').length;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bed Management</h2>
          <p className="text-muted-foreground">Track ward and bed availability.</p>
        </div>
        <Button className="shadow-md shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Add Bed
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Beds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beds.length}</div>
            </CardContent>
          </Card>
        </MotionDiv>
        <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{available}</div>
            </CardContent>
          </Card>
        </MotionDiv>
        <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{occupied}</div>
            </CardContent>
          </Card>
        </MotionDiv>
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
                  <TableHead>Bed Number</TableHead>
                  <TableHead>Ward / Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beds.map((bed) => (
                  <TableRow key={bed._id}>
                    <TableCell className="font-medium">{bed.bedNumber || bed.number || bed._id?.slice(-6)}</TableCell>
                    <TableCell>{[bed.ward, bed.type].filter(Boolean).join(' • ') || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          bed.status === 'occupied'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {bed.status || 'available'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {bed.status !== 'occupied' && (
                        <Button variant="ghost" size="sm">
                          <UserCheck className="mr-1 h-4 w-4" /> Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && beds.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No beds registered.</div>
          )}
        </div>
      </Card>
    </MotionDiv>
  );
}
