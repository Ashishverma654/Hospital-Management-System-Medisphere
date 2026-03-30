import { useEffect, useState } from 'react';
import { labOrderApi, labRecommendationApi, labTestApi } from '../../services/apiServices.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars
import { Button } from '../../components/ui/button.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';

export default function PatientLabTests() {
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [externalNotes, setExternalNotes] = useState({});

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await labOrderApi.getMy();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load lab tests.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await labRecommendationApi.getMy();
        const list = Array.isArray(data) ? data : data?.data || [];
        setRecommendations(list);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load lab recommendations.');
      }
    };

    loadRecommendations();
  }, []);

  useEffect(() => {
    const loadTests = async () => {
      try {
        const data = await labTestApi.getAll();
        const list = Array.isArray(data) ? data : data?.data || [];
        setAvailableTests(list);
      } catch {
        setAvailableTests([]);
      }
    };

    loadTests();
  }, []);

  const handleAddTest = (testId) => {
    if (!testId) return;
    const match = availableTests.find((test) => String(test._id) === String(testId));
    if (!match) return;
    if (selectedTests.find((test) => String(test._id) === String(testId))) {
      toast.error('This test is already added.');
      return;
    }
    setSelectedTests((prev) => [...prev, match]);
    setSelectedTest('');
  };

  const handleRemoveTest = (testId) => {
    setSelectedTests((prev) => prev.filter((test) => String(test._id) !== String(testId)));
  };

  const handlePlacePatientOrder = async () => {
    if (selectedTests.length === 0) {
      toast.error('Select at least one test to place an order.');
      return;
    }
    try {
      setPlacingOrder(true);
      await labOrderApi.createPatient({
        tests: selectedTests.map((test) => ({
          testId: test._id,
          testName: test.name,
        })),
        urgency: 'routine',
      });
      toast.success('Lab order placed successfully.');
      setSelectedTests([]);
      const data = await labOrderApi.getMy();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place lab order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleMarkExternal = async (recommendationId) => {
    try {
      await labRecommendationApi.markExternal(recommendationId, {
        notes: externalNotes[recommendationId] || '',
      });
      toast.success('Marked as external testing.');
      const data = await labRecommendationApi.getMy();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update recommendation.');
    }
  };

  const handlePlaceRecommendationOrder = async (recommendationId) => {
    try {
      await labRecommendationApi.placeOrder(recommendationId);
      toast.success('Lab order placed successfully.');
      const [recData, orderData] = await Promise.all([
        labRecommendationApi.getMy(),
        labOrderApi.getMy(),
      ]);
      setRecommendations(Array.isArray(recData) ? recData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order.');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Diagnostics</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Lab tests and schedules</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          View ordered tests, payment state, scheduled sample collection time, and expected report pickup timing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Doctor recommendations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your doctor has suggested these tests. You can proceed with MediFlow Lab or mark them as external.
          </p>
          <div className="mt-4 space-y-4">
            {recommendations.map((recommendation) => (
              <div key={recommendation._id} className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      {recommendation.doctorId?.userId?.name || 'Doctor recommendation'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.tests?.map((test) => test.testName).join(', ') || 'Tests'}
                    </p>
                  </div>
                  <StatusBadge status={recommendation.status}>{recommendation.status}</StatusBadge>
                </div>
                {recommendation.status === 'recommended' && (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      placeholder="Add a note if you plan to test elsewhere (optional)"
                      value={externalNotes[recommendation._id] || ''}
                      onChange={(e) =>
                        setExternalNotes((prev) => ({ ...prev, [recommendation._id]: e.target.value }))
                      }
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => handlePlaceRecommendationOrder(recommendation._id)}
                      >
                        Proceed with MediFlow Lab
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleMarkExternal(recommendation._id)}
                      >
                        Mark External
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
                No pending recommendations from your doctor yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Place your own lab order</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select tests and place an order directly with MediFlow Lab.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="patientTest">Select test</Label>
              <Select value={selectedTest} onValueChange={(value) => handleAddTest(value)}>
                <SelectTrigger id="patientTest">
                  <SelectValue placeholder="Choose a lab test" />
                </SelectTrigger>
                <SelectContent>
                  {availableTests.map((test) => (
                    <SelectItem key={test._id} value={test._id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {selectedTests.map((test) => (
                <div key={test._id} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <span className="text-sm text-foreground">{test.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTest(test._id)}>
                    Remove
                  </Button>
                </div>
              ))}
              {selectedTests.length === 0 && (
                <p className="text-sm text-muted-foreground">No tests selected yet.</p>
              )}
            </div>
            <Button type="button" className="w-full" onClick={handlePlacePatientOrder} disabled={placingOrder}>
              {placingOrder ? 'Placing order...' : 'Place Lab Order'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.doctorName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{order.items?.map((item) => item.testName).join(', ')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
                <StatusBadge status={order.paymentStatus}>{order.paymentStatus}</StatusBadge>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Sample collection</p>
                <p className="mt-2 font-medium text-foreground">
                  {order.sampleCollectionSchedule?.date && order.sampleCollectionSchedule?.time
                    ? `${order.sampleCollectionSchedule.date} at ${order.sampleCollectionSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Report pickup / ready time</p>
                <p className="mt-2 font-medium text-foreground">
                  {order.reportPickupSchedule?.date && order.reportPickupSchedule?.time
                    ? `${order.reportPickupSchedule.date} at ${order.reportPickupSchedule.time}`
                    : 'Not scheduled yet'}
                </p>
              </div>
            </div>
          </article>
        ))}

        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No lab orders have been created for this patient account yet.
          </div>
        )}
      </div>
    </motion.section>
  );
}
