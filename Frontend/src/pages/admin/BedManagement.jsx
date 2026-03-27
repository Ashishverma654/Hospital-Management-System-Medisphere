import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { bedApi, wardApi, departmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { BedDouble, Plus, RefreshCw, Search } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

const initialBedForm = {
  wardId: '',
  bedNumber: '',
  status: 'available',
  customPriceOverride: '',
};

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showBedForm, setShowBedForm] = useState(false);
  const [showAdmitForm, setShowAdmitForm] = useState(false);
  const [bedForm, setBedForm] = useState(initialBedForm);
  const [editingBed, setEditingBed] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [activeBed, setActiveBed] = useState(null);
  const [pendingDischarge, setPendingDischarge] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [admissionForm, setAdmissionForm] = useState({ patientId: '', prescriptionId: '' });
  const [saving, setSaving] = useState(false);

  const loadWards = async () => {
    try {
      const data = await wardApi.getAll({
        isActive: true,
        departmentId: filterDepartment || undefined,
      });
      setWards(Array.isArray(data) ? data : []);
    } catch {
      setWards([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getAll({ isActive: true });
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    }
  };

  const loadBeds = async () => {
    try {
      const data = await bedApi.getAll({
        search,
        wardId: filterWard || undefined,
        status: filterStatus || undefined,
        departmentId: filterDepartment || undefined,
      });
      setBeds(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load beds.');
    }
  };

  const loadCandidates = async (searchValue = '') => {
    try {
      const data = await bedApi.getAdmissionCandidates({ search: searchValue || undefined });
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load admission candidates.');
    }
  };

  useEffect(() => {
    loadWards();
    loadDepartments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadWards();
  }, [filterDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadBeds();
  }, [search, filterWard, filterStatus, filterDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDepartmentId = (ward) => ward.departmentId?._id || ward.departmentId || '';
  const wardOptions = filterDepartment
    ? wards.filter((ward) => getDepartmentId(ward) === filterDepartment)
    : wards;

  useEffect(() => {
    if (filterWard && !wardOptions.some((ward) => ward._id === filterWard)) {
      setFilterWard('');
    }
  }, [filterDepartment, wards]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showAdmitForm) {
      loadCandidates(candidateSearch);
    }
  }, [showAdmitForm, candidateSearch]);

  const openCreate = () => {
    setEditingBed(null);
    setBedForm(initialBedForm);
    setShowBedForm(true);
  };

  const openEdit = (bed) => {
    setEditingBed(bed);
    setBedForm({
      wardId: bed.wardId?._id || '',
      bedNumber: bed.bedNumber || '',
      status: bed.status || 'available',
      customPriceOverride: bed.customPriceOverride ?? '',
    });
    setShowBedForm(true);
  };

  const openAdmit = (bed) => {
    setSelectedBed(bed);
    setAdmissionForm({ patientId: '', prescriptionId: '' });
    setShowAdmitForm(true);
    setCandidateSearch('');
  };

  const selectBed = (bed) => {
    setActiveBed(bed);
  };

  const submitBed = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...bedForm,
      customPriceOverride: bedForm.customPriceOverride === '' ? undefined : Number(bedForm.customPriceOverride),
    };

    try {
      if (editingBed) {
        await bedApi.update(editingBed._id, payload);
        toast.success('Bed updated successfully.');
      } else {
        await bedApi.add(payload);
        toast.success('Bed created successfully.');
      }
      setShowBedForm(false);
      setBedForm(initialBedForm);
      setEditingBed(null);
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bed.');
    } finally {
      setSaving(false);
    }
  };

  const submitAdmission = async (event) => {
    event.preventDefault();
    if (!selectedBed) return;

    try {
      await bedApi.assign(selectedBed._id, admissionForm);
      toast.success('Patient admitted successfully.');
      setShowAdmitForm(false);
      setSelectedBed(null);
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to admit patient.');
    }
  };

  const discharge = async (bed) => {
    try {
      await bedApi.discharge(bed._id);
      toast.success('Patient discharged successfully.');
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to discharge patient.');
    }
  };

  const confirmDischarge = (bed) => {
    setPendingDischarge(bed);
  };

  const updateStatus = async (bed, status) => {
    try {
      await bedApi.update(bed._id, { status });
      toast.success('Bed status updated.');
      await loadBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bed status.');
    }
  };

  const confirmStatusChange = (bed, status) => {
    setPendingStatusChange({ bed, status });
  };

  const bedStats = beds.reduce(
    (acc, bed) => {
      acc.total += 1;
      acc[bed.status] = (acc[bed.status] || 0) + 1;
      return acc;
    },
    { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 }
  );

  const statusStyles = {
    available: 'border-emerald-500/40 bg-emerald-500/5',
    occupied: 'border-rose-500/40 bg-rose-500/5',
    reserved: 'border-sky-500/40 bg-sky-500/5',
    maintenance: 'border-slate-400/40 bg-slate-500/10',
  };

  const groupedBeds = wardOptions.length
    ? wardOptions.map((ward) => ({
        ward,
        beds: beds
          .filter((bed) => (bed.wardId?._id || bed.wardId) === ward._id)
          .sort((a, b) => `${a.bedNumber}`.localeCompare(`${b.bedNumber}`)),
      }))
    : [
        {
          ward: null,
          beds: [...beds].sort((a, b) => `${a.bedNumber}`.localeCompare(`${b.bedNumber}`)),
        },
      ];

  const layoutPresets = [
    { label: '2 x 6', cols: 6 },
    { label: '3 x 4', cols: 4 },
    { label: '4 x 4', cols: 4 },
    { label: '3 x 6', cols: 6 },
    { label: '4 x 6', cols: 6 },
    { label: 'Auto', cols: 0 },
  ];

  const [wardLayouts, setWardLayouts] = useState({});

  const getDefaultCols = (count) => {
    if (count <= 8) return 4;
    if (count <= 12) return 4;
    if (count <= 18) return 6;
    return 8;
  };

  const getColsForWard = (wardId, count) => {
    const override = wardLayouts[wardId];
    if (override && override > 0) return override;
    return getDefaultCols(count);
  };

  const rowLabel = (index) => String.fromCharCode(65 + index);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Inpatient Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Bed management</h2>
          
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bed
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bed number or ward" className="w-full rounded-2xl border border-border bg-card py-3 pl-9 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <select
          value={filterDepartment}
          onChange={(event) => {
            setFilterDepartment(event.target.value);
            setFilterWard('');
          }}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
        <select value={filterWard} onChange={(event) => setFilterWard(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All wards</option>
          {wardOptions.map((ward) => (
            <option key={ward._id} value={ward._id}>
              {ward.name}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        <Button type="button" variant="outline" onClick={loadBeds}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <article className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Bed map</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">Visual bed allocation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap a bed to view quick actions or drill into patient details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge status="available">Available</StatusBadge>
            <StatusBadge status="occupied">Occupied</StatusBadge>
            <StatusBadge status="reserved">Reserved</StatusBadge>
            <StatusBadge status="maintenance">Maintenance</StatusBadge>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {groupedBeds.map((group) => (
            <div key={group.ward?._id || 'all'} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {group.ward?.name || 'All beds'}
                  </p>
                  {group.ward && (
                    <p className="text-xs text-muted-foreground">
                      Ward {group.ward.wardNumber || group.ward.wardCode || '—'} • {group.beds.length} beds
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {group.ward?.departmentId?.name && (
                    <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-foreground">
                      {group.ward.departmentId.name}
                    </span>
                  )}
                  {group.ward && (
                    <select
                      value={wardLayouts[group.ward._id] || 0}
                      onChange={(event) =>
                        setWardLayouts((current) => ({
                          ...current,
                          [group.ward._id]: Number(event.target.value),
                        }))
                      }
                      className="h-8 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground"
                    >
                      {layoutPresets.map((preset) => (
                        <option key={preset.label} value={preset.cols}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {group.beds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No beds available in this ward.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border bg-card/40 p-4">
                  {(() => {
                    const cols = getColsForWard(group.ward?._id || 'all', group.beds.length);
                    const rows = Math.ceil(group.beds.length / cols);
                    return (
                      <div
                        className="grid gap-3"
                        style={{ gridTemplateColumns: `72px repeat(${cols}, minmax(140px, 1fr))` }}
                      >
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                          <div key={`row-${rowIndex}`} className="contents">
                            <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/40 py-6 text-xs font-semibold text-muted-foreground">
                              {rowLabel(rowIndex)}
                            </div>
                            {Array.from({ length: cols }).map((__, colIndex) => {
                              const bedIndex = rowIndex * cols + colIndex;
                              const bed = group.beds[bedIndex];
                              if (!bed) {
                                return <div key={`empty-${rowIndex}-${colIndex}`} />;
                              }
                              const isSelected = activeBed?._id === bed._id;
                              const statusClass = statusStyles[bed.status] || 'border-border bg-card';
                              return (
                                <button
                                  key={bed._id}
                                  type="button"
                                  onClick={() => selectBed(bed)}
                                  className={`group w-full rounded-2xl border p-4 text-left transition ${
                                    isSelected ? 'border-primary bg-muted/40 shadow-sm' : statusClass
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">{bed.bedNumber}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {bed.type ? bed.type : 'General'} • {bed.wardId?.name || bed.ward}
                                      </p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/40">
                                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <StatusBadge status={bed.status}>{bed.status}</StatusBadge>
                                    <span className="text-xs text-muted-foreground">
                                      {bed.patient?.name || 'Vacant'}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {bed.status === 'available' && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openAdmit(bed);
                                        }}
                                        className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                                      >
                                        Admit
                                      </button>
                                    )}
                                    {bed.status !== 'occupied' && bed.status !== 'available' && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          confirmStatusChange(bed, 'available');
                                        }}
                                        className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                                      >
                                        Mark Available
                                      </button>
                                    )}
                                    {bed.status !== 'occupied' && bed.status !== 'reserved' && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          confirmStatusChange(bed, 'reserved');
                                        }}
                                        className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                                      >
                                        Reserve
                                      </button>
                                    )}
                                    {bed.status !== 'occupied' && bed.status !== 'maintenance' && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          confirmStatusChange(bed, 'maintenance');
                                        }}
                                        className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                                      >
                                        Maintenance
                                      </button>
                                    )}
                                    {bed.status === 'occupied' && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          confirmDischarge(bed);
                                        }}
                                        className="rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Discharge
                                      </button>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
          {beds.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No beds match the current filters.
            </div>
          )}
        </div>

        {activeBed && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{activeBed.bedNumber}</p>
              <p className="text-xs text-muted-foreground">
                {activeBed.wardId?.name || activeBed.ward} • {activeBed.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(activeBed)}>Edit</Button>
              {activeBed.status === 'available' && <Button size="sm" onClick={() => openAdmit(activeBed)}>Admit</Button>}
              {activeBed.status === 'occupied' && (
                <Button size="sm" variant="destructive" onClick={() => discharge(activeBed)}>Discharge</Button>
              )}
              {activeBed.status !== 'occupied' && activeBed.status !== 'maintenance' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(activeBed, 'maintenance')}>Maintenance</Button>
              )}
              {activeBed.status !== 'occupied' && activeBed.status !== 'reserved' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(activeBed, 'reserved')}>Reserve</Button>
              )}
              {activeBed.status !== 'occupied' && activeBed.status !== 'available' && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(activeBed, 'available')}>Mark Available</Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total beds', value: bedStats.total },
            { label: 'Available', value: bedStats.available },
            { label: 'Occupied', value: bedStats.occupied },
            { label: 'Reserved', value: bedStats.reserved },
            { label: 'Maintenance', value: bedStats.maintenance },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Bed</th>
                <th className="px-4 py-3 font-medium">Ward</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Effective Price</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {beds.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No beds found for the selected filters.</td>
                </tr>
              )}
              {beds.map((bed) => (
                <tr key={bed._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{bed.bedNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{bed.type}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bed.wardId?.name || bed.ward} {bed.wardId?.wardNumber ? `• ${bed.wardId.wardNumber}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-foreground">{bed.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bed.patient ? (
                      <>
                        <p>{bed.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{bed.patient.patientId || 'No patient ID'}</p>
                      </>
                    ) : (
                      'Vacant'
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">₹{Number(bed.effectivePrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(bed)}>Edit</Button>
                      {bed.status === 'available' && <Button size="sm" onClick={() => openAdmit(bed)}>Admit</Button>}
                      {bed.status === 'occupied' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDischarge(bed)}
                        >
                          Discharge
                        </Button>
                      )}
                      {bed.status !== 'occupied' && bed.status !== 'maintenance' && (
                        <Button size="sm" variant="outline" onClick={() => confirmStatusChange(bed, 'maintenance')}>
                          Maintenance
                        </Button>
                      )}
                      {bed.status !== 'occupied' && bed.status !== 'reserved' && (
                        <Button size="sm" variant="outline" onClick={() => confirmStatusChange(bed, 'reserved')}>
                          Reserve
                        </Button>
                      )}
                      {bed.status !== 'occupied' && bed.status !== 'available' && (
                        <Button size="sm" variant="outline" onClick={() => confirmStatusChange(bed, 'available')}>
                          Mark Available
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {showBedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitBed} className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">{editingBed ? 'Edit Bed' : 'Add Bed'}</h3>
              <button type="button" onClick={() => setShowBedForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Ward">
                <select value={bedForm.wardId} onChange={(event) => {
                  const selectedWard = wards.find(w => w._id === event.target.value);
                  setBedForm((current) => ({ ...current, wardId: event.target.value, _wardCode: selectedWard?.wardCode || selectedWard?.wardNumber || '' }));
                }} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" required>
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward._id} value={ward._id}>
                      {ward.name} ({ward.wardCode || ward.wardNumber})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Bed Number ${editingBed ? '' : '(optional – auto-generated if empty)'}`}>
                <input type="text" value={bedForm.bedNumber} onChange={(event) => setBedForm((current) => ({ ...current, bedNumber: event.target.value }))} placeholder={bedForm._wardCode ? `e.g. BED-${bedForm._wardCode}-N` : 'Auto-generated'} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
              <Field label="Status">
                <select value={bedForm.status} onChange={(event) => setBedForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </Field>
              <Field label="Custom price override">
                <input type="number" min="0" value={bedForm.customPriceOverride} onChange={(event) => setBedForm((current) => ({ ...current, customPriceOverride: event.target.value }))} className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
              </Field>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBedForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving...' : editingBed ? 'Save Changes' : 'Create Bed'}</Button>
            </div>
          </form>
        </div>
      )}

      {showAdmitForm && selectedBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitAdmission} className="w-full max-w-3xl rounded-2xl bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground">Admit patient to Bed {selectedBed.bedNumber}</h3>
              <button type="button" onClick={() => setShowAdmitForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-4">
              <input type="text" value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Search patient by name, ID, phone, or email" className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-primary" />
            </div>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={candidate.isCurrentlyAdmitted}
                  onClick={() => setAdmissionForm({ patientId: candidate.id, prescriptionId: candidate.admissionRecommendation?.prescriptionId || '' })}
                  className={`w-full rounded-xl border p-4 text-left ${candidate.isCurrentlyAdmitted ? 'cursor-not-allowed border-border bg-muted opacity-70' : admissionForm.patientId === candidate.id ? 'border-slate-900 bg-muted/50' : 'border-border hover:border-border'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.patientId || 'No patient ID'} • {candidate.phone || 'No phone'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {candidate.isCurrentlyAdmitted ? 'Already admitted' : 'Not currently admitted'}
                      </p>
                    </div>
                    {candidate.admissionRecommendation && (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                        <p className="font-semibold">Doctor recommendation visible</p>
                        <p className="mt-1">{candidate.admissionRecommendation.doctor?.name || 'Doctor'} recommended admission.</p>
                      </div>
                    )}
                  </div>
                  {candidate.admissionRecommendation?.admissionRecommendationNotes && (
                    <p className="mt-3 text-sm text-muted-foreground">{candidate.admissionRecommendation.admissionRecommendationNotes}</p>
                  )}
                </button>
              ))}
              {candidates.length === 0 && <p className="text-sm text-muted-foreground">No admission candidates found.</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdmitForm(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={!admissionForm.patientId}>Confirm Admission</Button>
            </div>
          </form>
        </div>
      )}

      {pendingDischarge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">Confirm discharge</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Discharge patient from bed <span className="font-semibold text-foreground">{pendingDischarge.bedNumber}</span>?
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPendingDischarge(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  discharge(pendingDischarge);
                  setPendingDischarge(null);
                }}
              >
                Confirm Discharge
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">Confirm status change</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Set bed <span className="font-semibold text-foreground">{pendingStatusChange.bed.bedNumber}</span> to{' '}
              <span className="font-semibold text-foreground">{pendingStatusChange.status}</span>?
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPendingStatusChange(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  updateStatus(pendingStatusChange.bed, pendingStatusChange.status);
                  setPendingStatusChange(null);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
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
