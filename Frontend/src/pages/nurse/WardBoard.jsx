import { useEffect, useState } from 'react';
import { nurseApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function NurseWardBoard() {
  const [board, setBoard] = useState({ wards: [], totalPatients: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await nurseApi.getWardBoard();
        setBoard(data || { wards: [], totalPatients: 0 });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load ward board.');
      }
    };

    load();
  }, []);

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Ward View</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Ward board</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review ward occupancy, in-scope patients, and bed distribution for your current nursing assignments.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Assigned wards</p>
          <h3 className="mt-2 text-3xl font-semibold text-foreground">{board.wards?.length || 0}</h3>
        </article>
        <article className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Patients in scope</p>
          <h3 className="mt-2 text-3xl font-semibold text-foreground">{board.totalPatients || 0}</h3>
        </article>
        <article className="rounded-xl bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Occupied beds</p>
          <h3 className="mt-2 text-3xl font-semibold text-foreground">
            {(board.wards || []).reduce((total, ward) => total + (ward.occupancy || 0), 0)}
          </h3>
        </article>
      </section>

      <div className="space-y-6">
        {(board.wards || []).map((ward) => (
          <section key={ward.id} className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Ward Context</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">
                  {ward.name} {ward.wardNumber ? `• ${ward.wardNumber}` : ''}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ward.wardType || 'General ward'} {ward.floor ? `• Floor ${ward.floor}` : ''} {ward.block ? `• Block ${ward.block}` : ''}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">
                Occupancy {ward.occupancy || 0}/{ward.bedCount || ward.beds?.length || 0}
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
              <article>
                <p className="font-semibold text-foreground">Patient board</p>
                <div className="mt-3 space-y-3">
                  {(ward.patients || []).map((patient) => (
                    <div key={patient.id} className="rounded-xl border border-border p-4">
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {patient.patientId || 'No patient ID'} • {patient.assignedDoctor?.name || 'No doctor visible'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {patient.diagnosisSummary || 'No diagnosis summary available.'}
                      </p>
                    </div>
                  ))}
                  {ward.patients?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No patient-specific assignments are linked to this ward yet.</p>
                  )}
                </div>
              </article>

              <article>
                <p className="font-semibold text-foreground">Bed overview</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(ward.beds || []).map((bed) => (
                    <div key={bed.id} className="rounded-xl border border-border p-4">
                      <p className="font-medium text-foreground">Bed {bed.bedNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground capitalize">{bed.status || 'unknown'}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {bed.patientName ? `${bed.patientName} (${bed.patientId || 'No ID'})` : 'No patient assigned'}
                      </p>
                    </div>
                  ))}
                  {ward.beds?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bed occupancy data is available for this ward.</p>
                  )}
                </div>
              </article>
            </div>
          </section>
        ))}

        {board.wards?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No ward assignments are available for this nurse account.
          </div>
        )}
      </div>
    </motion.section>
  );
}
