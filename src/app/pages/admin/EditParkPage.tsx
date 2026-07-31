import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus, Trash2, ChevronLeft, Save } from 'lucide-react';
import {
  useAdminParks,
  useUpdatePark,
  useUpdateTrail,
  useDeleteTrail,
  useAddTrailToPark,
  useRenamepark,
} from '../../hooks/useAdminData';
import { Trail } from '../../lib/supabase';
import {
  getCityRegion,
  isParkRegion,
  PARK_REGION_LABELS,
  PARK_REGIONS,
  type ParkRegion,
} from '../../lib/regions';
import { toast } from 'sonner';

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

const DIFFICULTIES = [
  { value: '', label: 'No rating' },
  { value: 'easy', label: 'Easy' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'difficult', label: 'Difficult' },
  { value: 'expert', label: 'Expert' },
];

interface NewTrailRow {
  id: number;
  name: string;
  difficulty: string;
}

let nextId = 1000;

export function EditParkPage() {
  const { parkName } = useParams<{ parkName: string }>();
  const decoded = decodeURIComponent(parkName || '');
  const navigate = useNavigate();

  const { data: parks, isLoading } = useAdminParks();
  const updatePark = useUpdatePark();
  const renamePark = useRenamepark();
  const updateTrail = useUpdateTrail();
  const deleteTrail = useDeleteTrail();
  const addTrail = useAddTrailToPark();

  const park = parks?.find((p) => p.name === decoded);

  const [parkNameInput, setParkNameInput] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEs, setDescriptionEs] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState<ParkRegion | ''>('');
  const [editingTrails, setEditingTrails] = useState<Record<string, Trail>>({});
  const [newTrails, setNewTrails] = useState<NewTrailRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (park) {
      setParkNameInput(park.name);
      setDescription(park.description ?? '');
      setDescriptionEs(park.description_es ?? '');
      setCity(park.city ?? '');
      setRegion(
        isParkRegion(park.region)
          ? park.region
          : getCityRegion(park.city) ?? ''
      );
      const map: Record<string, Trail> = {};
      park.trails.forEach((t) => { map[t.id] = { ...t }; });
      setEditingTrails(map);
    }
  }, [
    park?.name,
    park?.description,
    park?.description_es,
    park?.city,
    park?.region,
  ]);

  const addNewTrailRow = () => {
    setNewTrails((prev) => [...prev, { id: nextId++, name: '', difficulty: '' }]);
  };

  const updateNewTrail = (id: number, field: keyof Omit<NewTrailRow, 'id'>, value: string) => {
    setNewTrails((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeNewTrail = (id: number) => {
    setNewTrails((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteExisting = async (trail: Trail) => {
    if (!confirm(`Delete "${trail.name}"?`)) return;
    try {
      await deleteTrail.mutateAsync(trail.id);
      setEditingTrails((prev) => {
        const next = { ...prev };
        delete next[trail.id];
        return next;
      });
      toast.success('Trail deleted');
    } catch {
      toast.error('Failed to delete trail');
    }
  };

  const handleSave = async () => {
    const trimmedName = parkNameInput.trim();
    if (!trimmedName) { toast.error('Park name is required'); return; }
    setSaving(true);
    try {
      // Rename if name changed (updates all trail locations + parks table key)
      const effectiveName = trimmedName !== decoded ? trimmedName : decoded;
      if (trimmedName !== decoded) {
        await renamePark.mutateAsync({ oldName: decoded, newName: trimmedName });
      }

      // Update park metadata
      await updatePark.mutateAsync({
        name: effectiveName,
        description: description.trim() || null,
        description_es: descriptionEs.trim() || null,
        city: city.trim() || null,
        region: region || getCityRegion(city.trim()) || null,
      });

      // Update existing trails
      await Promise.all(
        Object.values(editingTrails).map((t) =>
          updateTrail.mutateAsync({
            id: t.id,
            updates: { name: t.name, difficulty: t.difficulty },
          })
        )
      );

      // Add new trails
      const validNew = newTrails.filter((t) => t.name.trim());
      await Promise.all(
        validNew.map((t) =>
          addTrail.mutateAsync({
            name: t.name.trim(),
            location: effectiveName,
            description: null,
            difficulty: t.difficulty || null,
          })
        )
      );

      toast.success('Park saved');
      navigate('/admin/parks');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-[13px] text-[#687588]">Loading…</div>;
  }

  if (!park) {
    return <div className="p-8 text-[13px] text-[#687588]">Park not found.</div>;
  }

  const existingTrails = Object.values(editingTrails);

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/admin/parks')}
          className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#f0ede6] text-[#687588]"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] font-bold text-[#1a1a1a] truncate">{decoded}</h1>
          <p className="text-[14px] text-[#687588] mt-0.5">
            {existingTrails.length} trail{existingTrails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[#2c4a1e] text-white text-[13px] font-bold hover:bg-[#1a3010] disabled:opacity-50 transition-colors"
        >
          <Save className="size-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Park description */}
        <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-6 flex flex-col gap-4">
          <h2 className="text-[13px] font-bold tracking-[1px] uppercase text-[#687588]">Park</h2>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Name <span className="text-red-500">*</span></label>
            <input
              value={parkNameInput}
              onChange={(e) => setParkNameInput(e.target.value)}
              placeholder="Park name"
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">City</label>
            <input
              list="pr-municipalities-edit"
              value={city}
              onChange={(e) => {
                const next = e.target.value;
                setCity(next);
                const suggested = getCityRegion(next);
                if (suggested) setRegion(suggested);
              }}
              placeholder="e.g. Vega Alta"
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
            />
            <datalist id="pr-municipalities-edit">
              {PR_MUNICIPALITIES.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion((e.target.value || '') as ParkRegion | '')}
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
              Used by park filters. Auto-fills from city; override if needed.
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Description (English)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the park, access points, highlights…"
              rows={3}
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1a1a1a] resize-none focus:outline-none focus:border-[#2c4a1e]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Description (Español)</label>
            <textarea
              value={descriptionEs}
              onChange={(e) => setDescriptionEs(e.target.value)}
              placeholder="Describe el parque, puntos de acceso, atractivos…"
              rows={3}
              className="w-full border border-[#e5e0d5] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1a1a1a] resize-none focus:outline-none focus:border-[#2c4a1e]"
            />
          </div>
        </div>

        {/* Existing trails */}
        <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-[1px] uppercase text-[#687588]">
              Trails <span className="text-[#2c4a1e]">{existingTrails.length + newTrails.filter(t => t.name.trim()).length}</span>
            </h2>
            <button
              type="button"
              onClick={addNewTrailRow}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#f0ede6] hover:bg-[#e5e0d5] text-[#2c4a1e] text-[12px] font-bold transition-colors"
            >
              <Plus className="size-3.5" />
              Add trail
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {existingTrails.map((trail, i) => (
              <div key={trail.id} className="border border-[#f0ede6] rounded-[12px] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#687588] tracking-[0.5px]">TRAIL {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExisting(trail)}
                    className="size-6 flex items-center justify-center rounded-[6px] hover:bg-red-50 text-[#687588] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Name</label>
                  <input
                    value={trail.name}
                    onChange={(e) => setEditingTrails((prev) => ({ ...prev, [trail.id]: { ...prev[trail.id], name: e.target.value } }))}
                    className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Difficulty</label>
                  <select
                    value={trail.difficulty ?? ''}
                    onChange={(e) => setEditingTrails((prev) => ({ ...prev, [trail.id]: { ...prev[trail.id], difficulty: e.target.value || null } }))}
                    className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#374151] bg-white focus:outline-none"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* New trail rows */}
            {newTrails.map((trail, i) => (
              <div key={trail.id} className="border border-[#2c4a1e]/20 bg-[#f9fdf7] rounded-[12px] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2c4a1e] tracking-[0.5px]">NEW TRAIL {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeNewTrail(trail.id)}
                    className="size-6 flex items-center justify-center rounded-[6px] hover:bg-red-50 text-[#687588] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Name</label>
                  <input
                    value={trail.name}
                    onChange={(e) => updateNewTrail(trail.id, 'name', e.target.value)}
                    placeholder="Trail name"
                    className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#1a1a1a] focus:outline-none focus:border-[#2c4a1e]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Difficulty</label>
                  <select
                    value={trail.difficulty}
                    onChange={(e) => updateNewTrail(trail.id, 'difficulty', e.target.value)}
                    className="w-full border border-[#e5e0d5] rounded-[8px] px-3 h-9 text-[13px] text-[#374151] bg-white focus:outline-none"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {existingTrails.length === 0 && newTrails.length === 0 && (
              <p className="text-[13px] text-[#687588] text-center py-4">No trails yet. Add one above.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
