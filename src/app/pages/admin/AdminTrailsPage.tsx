import { useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, Upload } from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';
import {
  useAdminTrails,
  useAdminParks,
  useCreateTrail,
  useUpdateTrail,
  useDeleteTrail,
} from '../../hooks/useAdminData';
import { Trail } from '../../lib/supabase';
import { toast } from 'sonner';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

type TrailFormData = Pick<Trail, 'name' | 'location' | 'qr_code'>;

const OTHER = '__other__';

function TrailModal({
  trail,
  onClose,
}: {
  trail: Trail | null;
  onClose: () => void;
}) {
  const isEdit = !!trail;
  const create = useCreateTrail();
  const update = useUpdateTrail();
  const { data: parks } = useAdminParks();
  const parkNames = (parks ?? []).map((p) => p.name).sort();

  const [form, setForm] = useState<TrailFormData>({
    name: trail?.name ?? '',
    location: trail?.location ?? '',
    qr_code: trail?.qr_code ?? '',
  });

  // If editing and the location isn't in the park list, start in "other" mode
  const [parkSelect, setParkSelect] = useState<string>(() => {
    if (!trail?.location) return '';
    return parkNames.includes(trail.location) ? trail.location : OTHER;
  });
  const [customLocation, setCustomLocation] = useState(
    trail?.location && !parkNames.includes(trail.location) ? trail.location : ''
  );

  const handleParkSelect = (val: string) => {
    setParkSelect(val);
    if (val !== OTHER) setForm((f) => ({ ...f, location: val }));
    else setForm((f) => ({ ...f, location: customLocation }));
  };

  const handleCustomLocation = (val: string) => {
    setCustomLocation(val);
    setForm((f) => ({ ...f, location: val }));
  };

  const set = (key: keyof TrailFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: trail.id,
          updates: {
            name: form.name.trim(),
            location: form.location?.trim() || null,
            qr_code: form.qr_code?.trim() || null,
          },
        });
        toast.success('Trail updated');
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          location: form.location?.trim() || null,
          description: null,
          qr_code: form.qr_code?.trim() || null,
        });
        toast.success('Trail created');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg.includes('unique') ? 'A trail with that name or QR code already exists.' : 'Failed to save trail');
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-[#F2F5F2]">{isEdit ? 'Edit Trail' : 'New Trail'}</h2>
          <button type="button" onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-[#24302A]">
            <X className="size-4 text-[#8B958C]" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">Name *</label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. El Yunque Peak Trail"
            className="w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[14px] text-[#F2F5F2] focus:outline-none focus:ring-2 focus:ring-[#5EE08A]/30"
          />
        </div>

        {/* Park / Location */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">Park</label>
          <select
            value={parkSelect}
            onChange={(e) => handleParkSelect(e.target.value)}
            className="w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[14px] text-[#F2F5F2] bg-[#151C18] focus:outline-none focus:ring-2 focus:ring-[#5EE08A]/30"
          >
            <option value="">— No park —</option>
            {parkNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value={OTHER}>Other…</option>
          </select>
          {parkSelect === OTHER && (
            <input
              value={customLocation}
              onChange={(e) => handleCustomLocation(e.target.value)}
              placeholder="Enter park name"
              className="mt-2 w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[14px] text-[#F2F5F2] focus:outline-none focus:ring-2 focus:ring-[#5EE08A]/30"
            />
          )}
        </div>

        {/* QR Code */}
        <div className="mb-5">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">QR Code</label>
          <input
            value={form.qr_code ?? ''}
            onChange={set('qr_code')}
            placeholder="e.g. TRAIL_YUNQUE_PEAK"
            className="w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[14px] text-[#F2F5F2] focus:outline-none focus:ring-2 focus:ring-[#5EE08A]/30"
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] disabled:opacity-50">
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Trail'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteTrailModal({
  trail,
  onClose,
}: {
  trail: Trail;
  onClose: () => void;
}) {
  const del = useDeleteTrail();

  const handleDelete = async () => {
    try {
      await del.mutateAsync(trail.id);
      toast.success('Trail deleted');
      onClose();
    } catch {
      toast.error('Failed to delete trail');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-[#F2F5F2] text-center mb-2">Delete Trail</h2>
        <p className="text-[13px] text-[#9AA39C] text-center leading-relaxed">
          Permanently delete <strong>{trail.name}</strong> and all its reports?
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={del.isPending} className="flex-1 h-10 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-50">
            {del.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTrailsPage() {
  const { data: trails, isLoading } = useAdminTrails();
  const [editing, setEditing] = useState<Trail | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Trail | null>(null);
  const [parkFilter, setParkFilter] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const parks = Array.from(new Set((trails ?? []).map((t) => t.location).filter(Boolean))).sort() as string[];

  const filtered = (trails ?? []).filter(
    (t) => !parkFilter || t.location === parkFilter
  );
  const { page, setPage, pageCount, pageItems, total, pageSize, from, to } =
    useAdminPagination(filtered, parkFilter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#F2F5F2]">Trails</h1>
          <p className="text-[14px] text-[#8B958C] mt-1">{trails?.length ?? 0} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 h-10 px-4 bg-[#151C18] border border-[#24302A] text-[#9AA39C] text-[13px] font-bold rounded-[10px] hover:border-[#5EE08A] hover:text-[#5EE08A] transition-colors"
          >
            <Upload className="size-4" />
            Import CSV
          </button>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 h-10 px-4 bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold rounded-[10px] hover:bg-[#4ADE80]"
          >
            <Plus className="size-4" />
            New Trail
          </button>
        </div>
      </div>

      {/* Park filter */}
      <div className="mb-4">
        <select
          value={parkFilter}
          onChange={(e) => setParkFilter(e.target.value)}
          className="border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none"
        >
          <option value="">All parks</option>
          {parks.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-[#151C18] rounded-[16px] border border-[#24302A] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_80px] px-5 py-3 border-b border-[#24302A] bg-[#1A221C]">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Trail Name</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Park</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-right">Actions</p>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">No trails found.</div>
        )}

        {pageItems.map((trail, i) => {
          const displayName = trail.name.includes(' - ')
            ? trail.name.split(' - ').slice(1).join(' - ')
            : trail.name;
          return (
            <div
              key={trail.id}
              className={`grid grid-cols-[1fr_1fr_80px] px-5 py-3.5 items-center ${i !== pageItems.length - 1 ? 'border-b border-[#24302A]' : ''}`}
            >
              <p className="text-[13.5px] font-semibold text-[#F2F5F2] truncate pr-4">{displayName}</p>
              <p className="text-[13px] text-[#8B958C] truncate pr-4">{trail.location ?? '—'}</p>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setEditing(trail)}
                  className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#24302A] text-[#8B958C] hover:text-[#5EE08A] transition-colors"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(trail)}
                  className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        <AdminTablePagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          from={from}
          to={to}
          onPageChange={setPage}
        />
      </div>

      {importOpen && <CsvImportModal onClose={() => setImportOpen(false)} />}
      {editing !== null && (
        <TrailModal
          trail={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && <DeleteTrailModal trail={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
