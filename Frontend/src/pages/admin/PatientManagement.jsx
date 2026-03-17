import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { patientApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { CalendarDays, Eye, Pencil, RefreshCw, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialForm = {
  name: '',
  email: '',
  phone: '',
  gender: 'unknown',
  dateOfBirth: '',
  bloodGroup: '',
  address: '',
  profileStatus: 'active',
  isActive: true,
  allergies: '',
  chronicDiseases: '',
  insuranceProvider: '',
  insuranceNumber: '',
  notes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [board, setBoard] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProfileStatus, setFilterProfileStatus] = useState('');
  const [boardDate, setBoardDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientApi.getAdminList({
        search,
        isActive: filterStatus || undefined,
        profileStatus: filterProfileStatus || undefined,
      });
      setPatients(response.patients || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  };

  const loadBoard = async () => {
    setBoardLoading(true);
    try {
      const response = await patientApi.getAdminBoard({ date: boardDate });
      setBoard(response);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load daily patient board.');
    } finally {
      setBoardLoading(false);
    }
  };

  const loadPatientDetail = async (patientId) => {
    setDetailLoading(true);
    try {
      const response = await patientApi.getAdminById(patientId);
      setDetail(response);
      setSelectedPatient(patientId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load patient detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search, filterStatus, filterProfileStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadBoard();
  }, [boardDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEditor = () => {
    if (!detail?.patient) return;
    const patient = detail.patient;
    setForm({
      name: patient.user?.name || '',
      email: patient.user?.email || '',
      phone: patient.user?.phone || '',
      gender: patient.gender || 'unknown',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      bloodGroup: patient.bloodGroup || '',
      address: patient.user?.address || '',
      profileStatus: patient.profileStatus || 'active',
      isActive: patient.isActive,
      allergies: (patient.allergies || []).join(', '),
      chronicDiseases: (patient.chronicDiseases || []).join(', '),
      insuranceProvider: patient.insuranceProvider || '',
      insuranceNumber: patient.insuranceNumber || '',
      notes: patient.notes || '',
      emergencyContactName: patient.emergencyContact?.name || '',
      emergencyContactPhone: patient.emergencyContact?.phone || '',
      emergencyContactRelation: patient.emergencyContact?.relation || '',
    });
    setShowEditor(true);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return;

    // DOB Validation (100 years restriction)
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      const now = new Date();
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(now.getFullYear() - 100);
      
      if (dob > now || dob < hundredYearsAgo) {
        return toast.error('Please enter a valid date of birth (max 100 years old).');
      }
    }

    setSaving(true);
    try {
      await patientApi.updateAdmin(selectedPatient, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        bloodGroup: form.bloodGroup || null,
        address: form.address,
        profileStatus: form.profileStatus,
        isActive: form.isActive,
        allergies: splitList(form.allergies),
        chronicDiseases: splitList(form.chronicDiseases),
        insuranceProvider: form.insuranceProvider,
        insuranceNumber: form.insuranceNumber,
        notes: form.notes,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relation: form.emergencyContactRelation,
        },
      });
      toast.success('Patient profile updated successfully.');
      setShowEditor(false);
      loadPatients();
      loadPatientDetail(selectedPatient);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update patient profile.');
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Today registrations', value: board?.summary?.registrations ?? 0 },
      { label: 'Today appointments', value: board?.summary?.appointments ?? 0 },
      { label: 'Today admissions', value: board?.summary?.admissions ?? 0 },
      { label: 'Today discharges', value: board?.summary?.discharges ?? 0 },
      { label: 'Today cancellations', value: board?.summary?.cancellations ?? 0 },
    ],
    [board]
  );

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Patient Administration</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Patient Console</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review registrations, search patient records, update demographic profiles, and inspect linked appointments,
          prescriptions, lab reports, invoices, and timeline activity from one admin-facing workspace.
        </p>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Daily Patient Board</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">Operational activity by day</h3>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={boardDate}
              onChange={(event) => setBoardDate(event.target.value)}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <Button variant="outline" onClick={loadBoard}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((item) => (
            <article key={item.label} className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{boardLoading ? '...' : item.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <BoardList title="Registrations" items={board?.breakdown?.registrations || []} dateKey="createdAt" />
          <BoardList title="Appointments" items={board?.breakdown?.appointments || []} dateKey="createdAt" secondaryKey="doctor" />
          <BoardList title="Admissions" items={board?.breakdown?.admissions || []} dateKey="admittedAt" secondaryKey="bedNumber" />
          <BoardList title="Discharges" items={board?.breakdown?.discharges || []} dateKey="dischargedAt" secondaryKey="bedNumber" />
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <article className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, patient ID, phone, or email"
                className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All active states</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select value={filterProfileStatus} onChange={(event) => setFilterProfileStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
              <option value="">All profile states</option>
              <option value="active">Active</option>
              <option value="incomplete">Incomplete</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Patient</th>
                  <th className="px-3 py-3 font-medium">Patient ID</th>
                  <th className="px-3 py-3 font-medium">Contact</th>
                  <th className="px-3 py-3 font-medium">Gender / Age</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">Loading patients...</td>
                  </tr>
                )}
                {!loading && patients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No patients found.</td>
                  </tr>
                )}
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{patient.user?.name || 'Patient'}</p>
                      <p className="text-xs text-muted-foreground">{patient.bloodGroup || 'Blood group not set'}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{patient.user?.patientId || patient.medicalRecordNumber || '—'}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <p>{patient.user?.email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{patient.user?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <p className="capitalize">{patient.gender || 'unknown'}</p>
                      <p className="text-xs text-muted-foreground">{patient.age ?? '—'} years</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${patient.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
                          {patient.profileStatus || 'active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{new Date(patient.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="outline" onClick={() => loadPatientDetail(patient.id)}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl bg-card p-6 shadow-sm">
          {!detail && !detailLoading && (
            <div className="flex min-h-[420px] items-center justify-center text-center text-muted-foreground">
              Select a patient to inspect demographics, related records, and timeline activity.
            </div>
          )}

          {detailLoading && (
            <div className="flex min-h-[420px] items-center justify-center text-muted-foreground">Loading patient detail...</div>
          )}

          {detail?.patient && !detailLoading && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Patient Detail</p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{detail.patient.user?.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Patient ID: {detail.patient.user?.patientId || '—'} | MRN: {detail.patient.medicalRecordNumber || '—'}
                  </p>
                </div>
                <Button onClick={openEditor}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Patient
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard label="Email" value={detail.patient.user?.email} />
                <DetailCard label="Phone" value={detail.patient.user?.phone} />
                <DetailCard label="Gender" value={detail.patient.gender} />
                <DetailCard label="Date of birth" value={formatDate(detail.patient.dateOfBirth)} />
                <DetailCard label="Blood group" value={detail.patient.bloodGroup} />
                <DetailCard label="Address" value={detail.patient.user?.address} />
                <DetailCard label="Emergency contact" value={formatEmergencyContact(detail.patient.emergencyContact)} />
                <DetailCard label="Insurance" value={formatInsurance(detail.patient)} />
              </div>

              <RelatedSection title="Clinical profile">
                <InfoPills items={detail.patient.allergies} emptyLabel="No allergies recorded" />
                <div className="mt-3">
                  <p className="text-sm font-medium text-foreground">Chronic diseases</p>
                  <InfoPills items={detail.patient.chronicDiseases} emptyLabel="No chronic diseases recorded" />
                </div>
              </RelatedSection>

              <RelatedSection title="Related records">
                <RelatedList title="Appointments" items={detail.related?.appointments || []} renderItem={(item) => `${item.date} • ${item.slot} • ${item.status}`} />
                <RelatedList title="Prescriptions" items={detail.related?.prescriptions || []} renderItem={(item) => item.diagnosis || 'Prescription created'} />
                <RelatedList title="Lab reports" items={detail.related?.labReports || []} renderItem={(item) => item.reportName} />
                <RelatedList title="Bills / Invoices" items={detail.related?.invoices || []} renderItem={(item) => `${item.billType} • ${item.paymentStatus} • ₹${Number(item.totalAmount || 0).toLocaleString()}`} />
                <RelatedList title="Admissions / Discharges" items={detail.related?.admissions || []} renderItem={(item) => `${item.bedNumber} • ${item.status}`} />
              </RelatedSection>

              <RelatedSection title="Timeline foundation">
                <div className="space-y-3">
                  {(detail.timeline || []).slice(0, 12).map((item, index) => (
                    <div key={`${item.type}-${item.id || index}`} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.type}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </RelatedSection>
            </div>
          )}
        </article>
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleUpdate} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Edit Patient Profile</h3>
              <button type="button" onClick={() => setShowEditor(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Patient name"><input type="text" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Email"><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Phone"><input type="text" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Gender">
                <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Date of birth"><input type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" max={new Date().toISOString().split('T')[0]} /></Field>
              <Field label="Blood group"><input type="text" value={form.bloodGroup} onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Profile status">
                <select value={form.profileStatus} onChange={(event) => setForm((current) => ({ ...current, profileStatus: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="active">Active</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Active patient account
              </label>
            </div>

            <Field label="Address" className="mt-4"><textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} className="min-h-[100px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
            <Field label="Allergies (comma separated)" className="mt-4"><input type="text" value={form.allergies} onChange={(event) => setForm((current) => ({ ...current, allergies: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
            <Field label="Chronic diseases (comma separated)" className="mt-4"><input type="text" value={form.chronicDiseases} onChange={(event) => setForm((current) => ({ ...current, chronicDiseases: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Insurance provider"><input type="text" value={form.insuranceProvider} onChange={(event) => setForm((current) => ({ ...current, insuranceProvider: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Insurance number"><input type="text" value={form.insuranceNumber} onChange={(event) => setForm((current) => ({ ...current, insuranceNumber: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Emergency contact name"><input type="text" value={form.emergencyContactName} onChange={(event) => setForm((current) => ({ ...current, emergencyContactName: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Emergency contact phone"><input type="text" value={form.emergencyContactPhone} onChange={(event) => setForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
              <Field label="Emergency relation"><input type="text" value={form.emergencyContactRelation} onChange={(event) => setForm((current) => ({ ...current, emergencyContactRelation: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>
            </div>

            <Field label="Admin notes" className="mt-4"><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[120px] w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" /></Field>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditor(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </div>
      )}
    </motion.section>
  );
}

function BoardList({ title, items, dateKey, secondaryKey }) {
  return (
    <article className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#ee4c35]" />
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded.</p>}
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-[1rem] bg-muted/50 p-3">
            <p className="font-medium text-foreground">{item.name || item.patient?.name || item.patientName || 'Patient activity'}</p>
            {secondaryKey && <p className="mt-1 text-sm text-muted-foreground">{item[secondaryKey] || '—'}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{new Date(item[dateKey]).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RelatedSection({ children, title }) {
  return (
    <section>
      <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RelatedList({ title, items, renderItem }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No records yet.</p>}
        {items.slice(0, 5).map((item) => (
          <div key={item._id} className="rounded-[1rem] border border-border p-3 text-sm text-muted-foreground">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPills({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-muted px-3 py-2 text-sm text-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <article className="rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value || '—'}</p>
    </article>
  );
}

function Field({ children, className = '', label }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatEmergencyContact(contact) {
  if (!contact?.name && !contact?.phone) return '—';
  return [contact.name, contact.phone, contact.relation].filter(Boolean).join(' • ');
}

function formatInsurance(patient) {
  if (!patient.insuranceProvider && !patient.insuranceNumber) return '—';
  return [patient.insuranceProvider, patient.insuranceNumber].filter(Boolean).join(' • ');
}
