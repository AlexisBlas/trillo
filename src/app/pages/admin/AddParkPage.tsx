import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import { useCreatePark, useUpdatePlaceRequest } from '../../hooks/useAdminData';
import {
  getCityRegion,
  PARK_REGION_LABELS,
  PARK_REGIONS,
  type ParkRegion,
} from '../../lib/regions';
import {
  getMunicipalityCoords,
  parseCoordInput,
} from '../../lib/municipalityCoords';
import { toast } from 'sonner';

interface TrailRow {
  id: number;
  name: string;
  difficulty: string;
}

export interface PlaceRequestDraft {
  id: string;
  kind: 'park' | 'trail';
  name: string;
  details: string | null;
}

const DIFFICULTIES = [
  { value: '', label: 'No rating' },
  { value: 'easy', label: 'Easy' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'difficult', label: 'Difficult' },
  { value: 'expert', label: 'Expert' },
];

const PR_MUNICIPALITIES = [
  'Adjuntas','Aguada','Aguadilla','Aguas Buenas','Aibonito','Añasco','Arecibo','Arroyo',
  'Barceloneta','Barranquitas','Bayamón','Cabo Rojo','Caguas','Camuy','Canóvanas',
  'Carolina','Cataño','Cayey','Ceiba','Ciales','Cidra','Coamo','Comerío','Corozal',
  'Culebra','Dorado','Fajardo','Florida','Guánica','Guayama','Guayanilla','Guaynabo',
  'Gurabo','Hatillo','Hormigueros','Humacao','Isabela','Jayuya','Juana Díaz','Juncos',
  'Lajas','Lares','Las Marías','Las Piedras','Loíza','Luquillo','Manatí','Maricao',
  'Maunabo','Mayagüez','Moca','Morovis','Naguabo','Naranjito','Orocovis','Patillas',
  'Peñuelas','Ponce','Quebradillas','Rincón','Río Grande','Sabana Grande','Salinas',
  'San Germán','San Juan','San Lorenzo','San Sebastián','Santa Isabel','Toa Alta',
  'Toa Baja','Trujillo Alto','Utuado','Vega Alta','Vega Baja','Vieques','Villalba',
  'Yabucoa','Yauco',
];

let nextId = 1;

function draftFromLocation(state: unknown): PlaceRequestDraft | null {
  if (!state || typeof state !== 'object') return null;
  const draft = (state as { fromRequest?: PlaceRequestDraft }).fromRequest;
  if (!draft?.id || !draft?.name || (draft.kind !== 'park' && draft.kind !== 'trail')) {
    return null;
  }
  return draft;
}

export function AddParkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreatePark();
  const updateRequest = useUpdatePlaceRequest();
  const fromRequest = draftFromLocation(location.state);

  const [parkName, setParkName] = useState(() =>
    fromRequest?.kind === 'park' ? fromRequest.name : ''
  );
  const [parkCity, setParkCity] = useState('');
  const [parkRegion, setParkRegion] = useState<ParkRegion | ''>('');
  const [parkLat, setParkLat] = useState('');
  const [parkLng, setParkLng] = useState('');
  const [parkDescription, setParkDescription] = useState(() =>
    fromRequest?.details?.trim() || ''
  );
  const [parkDescriptionEs, setParkDescriptionEs] = useState('');
  const [trails, setTrails] = useState<TrailRow[]>(() => [
    {
      id: nextId++,
      name: fromRequest?.kind === 'trail' ? fromRequest.name : '',
      difficulty: '',
    },
  ]);

  const addTrail = () => {
    setTrails((prev) => [...prev, { id: nextId++, name: '', difficulty: '' }]);
  };

  const removeTrail = (id: number) => {
    setTrails((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTrail = (id: number, field: keyof Omit<TrailRow, 'id'>, value: string) => {
    setTrails((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parkName.trim()) { toast.error('Park name is required'); return; }

    const parsedLat = parseCoordInput(parkLat);
    const parsedLng = parseCoordInput(parkLng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      toast.error('Coordinates must be valid numbers');
      return;
    }
    if ((parsedLat === null) !== (parsedLng === null)) {
      toast.error('Enter both latitude and longitude, or leave both blank');
      return;
    }
    if (parsedLat !== null && (parsedLat < -90 || parsedLat > 90)) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    if (parsedLng !== null && (parsedLng < -180 || parsedLng > 180)) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }

    const validTrails = trails.filter((t) => t.name.trim());
    try {
      await create.mutateAsync({
        name: parkName.trim(),
        description: parkDescription.trim() || null,
        description_es: parkDescriptionEs.trim() || null,
        city: parkCity.trim() || null,
        region: parkRegion || getCityRegion(parkCity.trim()) || null,
        lat: parsedLat,
        lng: parsedLng,
        trails: validTrails.map((t) => ({
          name: t.name.trim(),
          description: null,
          difficulty: t.difficulty || null,
        })),
      });
      if (fromRequest?.id) {
        try {
          await updateRequest.mutateAsync({ id: fromRequest.id, status: 'done' });
        } catch {
          /* park created; request status is secondary */
        }
      }
      toast.success('Park created');
      navigate('/admin/parks');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create park');
    }
  };

  const cityDefaultCoords = getMunicipalityCoords(parkCity);

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(fromRequest ? '/admin/requests' : '/admin/parks')}
          className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#f0ede6] text-[#687588]"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">New Park</h1>
          <p className="text-[14px] text-[#687588] mt-0.5">
            {fromRequest
              ? `Prefilling from ${fromRequest.kind} request`
              : 'Add a park and its trails'}
          </p>
        </div>
      </div>

      {fromRequest && (
        <div className="mb-5 rounded-[12px] border border-[#e5e0d5] bg-white px-4 py-3 text-[13px] text-[#374151]">
          Requested {fromRequest.kind}:{' '}
          <span className="font-bold text-[#1a1a1a]">{fromRequest.name}</span>
          {fromRequest.details ? (
            <span className="block mt-1 text-[#687588]">{fromRequest.details}</span>
          ) : null}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Park details */}
        <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-6 flex flex-col gap-4">
          <h2 className="text-[13px] font-bold tracking-[1px] uppercase text-[#687588]">Park</h2>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Name <span className="text-red-500">*</span></label>
              <input
                value={parkName}
                onChange={(e) => setParkName(e.target.value)}
                placeholder="e.g. Cerro Gordo Trail Network"
                className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1.5">City</label>
              <input
                list="pr-municipalities"
                value={parkCity}
                onChange={(e) => {
                  const next = e.target.value;
                  setParkCity(next);
                  const suggested = getCityRegion(next);
                  if (suggested) setParkRegion(suggested);
                }}
                placeholder="e.g. Vega Alta"
                className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
              />
              <datalist id="pr-municipalities">
                {PR_MUNICIPALITIES.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Region</label>
            <select
              value={parkRegion}
              onChange={(e) => setParkRegion((e.target.value || '') as ParkRegion | '')}
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e] bg-white"
            >
              <option value="">Select region…</option>
              {PARK_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {PARK_REGION_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[#687588]">
              Auto-fills from city; override if needed for filters.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">
              Coordinates <span className="font-normal text-[#687588]">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={parkLat}
                onChange={(e) => setParkLat(e.target.value)}
                inputMode="decimal"
                placeholder={
                  cityDefaultCoords ? String(cityDefaultCoords.lat) : 'Latitude'
                }
                className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
              />
              <input
                value={parkLng}
                onChange={(e) => setParkLng(e.target.value)}
                inputMode="decimal"
                placeholder={
                  cityDefaultCoords ? String(cityDefaultCoords.lng) : 'Longitude'
                }
                className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#687588]">
              Leave blank to use the city center for rain estimates.
              {cityDefaultCoords
                ? ` Default: ${cityDefaultCoords.lat}, ${cityDefaultCoords.lng}`
                : ''}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Description (English) <span className="text-[#687588] font-normal">(optional)</span></label>
            <textarea
              value={parkDescription}
              onChange={(e) => setParkDescription(e.target.value)}
              placeholder="Describe the park, access points, highlights…"
              rows={3}
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1a1a1a] resize-none focus:outline-none focus:border-[#2c4a1e]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Description (Español) <span className="text-[#687588] font-normal">(opcional)</span></label>
            <textarea
              value={parkDescriptionEs}
              onChange={(e) => setParkDescriptionEs(e.target.value)}
              placeholder="Describe el parque, puntos de acceso, atractivos…"
              rows={3}
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1a1a1a] resize-none focus:outline-none focus:border-[#2c4a1e]"
            />
          </div>
        </div>

        {/* Trails */}
        <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-[1px] uppercase text-[#687588]">
              Trails <span className="text-[#2c4a1e]">{trails.filter((t) => t.name.trim()).length}</span>
            </h2>
            <button
              type="button"
              onClick={addTrail}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#f0ede6] hover:bg-[#e5e0d5] text-[#2c4a1e] text-[12px] font-bold transition-colors"
            >
              <Plus className="size-3.5" />
              Add trail
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {trails.map((trail, i) => (
              <div key={trail.id} className="border border-[#f0ede6] rounded-[12px] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#687588] tracking-[0.5px]">TRAIL {i + 1}</span>
                  {trails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrail(trail.id)}
                      className="size-6 flex items-center justify-center rounded-[6px] hover:bg-red-50 text-[#687588] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Name</label>
                  <input
                    value={trail.name}
                    onChange={(e) => updateTrail(trail.id, 'name', e.target.value)}
                    placeholder="Trail name"
                    className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#374151] mb-1">Difficulty</label>
                    <select
                      value={trail.difficulty}
                      onChange={(e) => updateTrail(trail.id, 'difficulty', e.target.value)}
                      className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#374151] bg-white focus:outline-none"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(fromRequest ? '/admin/requests' : '/admin/parks')}
            className="flex-1 h-10 rounded-[10px] border border-[#e5e0d5] text-[13px] font-bold text-[#374151] hover:bg-[#f0ede6]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending || !parkName.trim()}
            className="flex-1 h-10 rounded-[10px] bg-[#2c4a1e] text-white text-[13px] font-bold hover:bg-[#1a3010] disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create Park'}
          </button>
        </div>
      </form>
    </div>
  );
}
