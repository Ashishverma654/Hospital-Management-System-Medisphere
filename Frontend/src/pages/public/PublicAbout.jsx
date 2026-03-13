import { useEffect, useState } from 'react';
import { getAwards, getLocations } from '../../services/apiServices.js';

export default function PublicAbout() {
  const [locations, setLocations] = useState([]);
  const [awards, setAwards] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [awardData, locationData] = await Promise.all([getAwards(), getLocations()]);
      setAwards(Array.isArray(awardData) ? awardData : []);
      setLocations(Array.isArray(locationData) ? locationData : []);
    };

    loadData();
  }, []);

  return (
    <section className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2.25rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-[#ee4c35]">About MediFlow</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">A patient-first hospital experience</h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            The public website now draws its trust signals, hospital branches, and doctor discovery content from the
            same governance system used by hospital administrators.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Hospital overview" description="Public-facing departments, specialists, and branch information now come from live hospital master data." />
          <InfoCard title="Locations" description={`${locations.length} active public branch${locations.length === 1 ? '' : 'es'} available for patients and visitors.`} />
          <InfoCard title="Trust signals" description={`${awards.length} active award${awards.length === 1 ? '' : 's'} available for public display.`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Hospital Locations</h2>
            <div className="mt-5 space-y-3">
              {locations.map((location) => (
                <article key={location._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{location.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{[location.city, location.state].filter(Boolean).join(', ')}</p>
                  <p className="mt-2 text-sm text-slate-500">{location.address}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Hospital Awards</h2>
            <div className="mt-5 space-y-3">
              {awards.map((award) => (
                <article key={award._id} className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">{award.year || 'Recognition'}</p>
                  <p className="mt-1 font-semibold text-slate-900">{award.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{award.organization}</p>
                  {award.description && <p className="mt-2 text-sm text-slate-500">{award.description}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ title, description }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
