import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { appointmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer } from '../../lib/animation-variants.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';

export default function PatientBookingPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const { user } = useSelector((state) => state.auth);
  const [payLater, setPayLater] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewData = useMemo(() => {
    if (!state || typeof state !== 'object') return null;
    const doctor = state.doctor || null;
    const form = state.form || {};
    const fee = Number(state.fee || 0);
    return {
      doctor,
      form,
      fee,
    };
  }, [state]);

  useEffect(() => {
    if (!previewData) {
      navigate('/patient/book-appointment', { replace: true });
    }
  }, [navigate, previewData]);

  const locationName = useMemo(() => {
    if (!previewData?.doctor || !previewData?.form?.hospitalLocationId) return null;
    const loc = (previewData.doctor.hospitalLocations || []).find(
      (l) => `${l._id || l.id}` === `${previewData.form.hospitalLocationId}`
    );
    if (!loc) return null;
    return `${loc.name}${loc.city ? ` • ${loc.city}` : ''}`;
  }, [previewData]);

  const appointmentDate = previewData?.form?.date || '';
  const appointmentSlot = previewData?.form?.slot || '';
  const consultationMode = previewData?.form?.consultationMode || 'in-person';
  const reasonForVisit = previewData?.form?.reasonForVisit || '';

  const handleConfirm = async () => {
    if (!previewData) return;
    setSaving(true);
    try {
      await appointmentApi.book({
        doctorId: previewData.form.doctorId,
        date: previewData.form.date,
        slot: previewData.form.slot,
        visitType: previewData.form.visitType,
        consultationMode: previewData.form.consultationMode,
        reasonForVisit: previewData.form.reasonForVisit,
        hospitalLocationId:
          previewData.form.consultationMode === 'in-person'
            ? previewData.form.hospitalLocationId || undefined
            : undefined,
      });
      toast.success('Appointment booked.');
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to book appointment.');
    } finally {
      setSaving(false);
    }
  };

  if (!previewData) {
    return null;
  }

  const totalAmount = previewData.fee;
  const paidNow = payLater ? 0 : totalAmount;
  const paidLater = payLater ? totalAmount : 0;

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-semibold text-foreground">Your Selections</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Review Services: 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Doctor Consult</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {previewData.doctor?.userId?.name || 'Doctor'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {previewData.doctor?.departmentId?.name || 'Department'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {consultationMode === 'in-person' ? 'In-Hospital Consultation' : `${consultationMode} Consultation`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">₹{totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">Location: {locationName || 'Not set'}</p>
                <p className="mt-1">{appointmentDate ? `${appointmentDate}, ${appointmentSlot}` : 'No slot selected'}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pay Later</span>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payLater}
                    onChange={(e) => setPayLater(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Enable</span>
                </label>
              </div>
            </div>

            {reasonForVisit && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Reason for visit</p>
                <p className="mt-2 text-sm text-muted-foreground">{reasonForVisit}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                {(user?.name || previewData?.doctor?.userId?.name || 'Patient')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name || 'Patient'}</p>
                <p className="text-xs text-muted-foreground">Self | UHID: N/A</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/book-appointment')}
                className="ml-auto text-sm font-semibold text-primary hover:underline"
              >
                Change
              </button>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-muted-foreground">Total Amount</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-semibold text-foreground">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-muted-foreground">Payment Summary</p>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>To Be Paid Now</span>
                  <span className="font-semibold">₹{paidNow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">To Be Paid Later</span>
                  <span className="font-semibold text-red-600">₹{paidLater.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={saving || !appointmentDate || !appointmentSlot || !previewData?.form?.doctorId}
              onClick={handleConfirm}
              className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? 'Booking…' : payLater ? 'Book Appointment' : 'Confirm & Pay'}
            </button>
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}
