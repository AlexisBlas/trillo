import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil, Trash2, X, AlertTriangle, Eye, EyeOff, Plus, Navigation, NavigationOff } from 'lucide-react';
import { useAdminParks, useRenamepark, useDeletePark, useToggleParkVisibility, AdminPark } from '../../hooks/useAdminData';
import {
  getCityRegion,
  isParkRegion,
  PARK_REGION_LABELS,
} from '../../lib/regions';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

function hasLocation(park: AdminPark) {
  return park.lat != null && park.lng != null;
}

function hasDirections(park: AdminPark) {
  return !!park.directions?.trim();
}

function parkRegionLabel(park: AdminPark): string {
  const region = isParkRegion(park.region)
    ? park.region
    : getCityRegion(park.city);
  return region ? PARK_REGION_LABELS[region] : '—';
}

function parkSetupLabel(park: AdminPark) {
  const location = hasLocation(park);
  const directions = hasDirections(park);
  if (location && directions) return 'Location and directions set';
  if (!location && !directions) return 'No location or directions';
  if (!location) return 'No location';
  return 'No directions';
}

function ParkSetupIcon({ park }: { park: AdminPark }) {
  const ready = hasLocation(park) && hasDirections(park);
  const label = parkSetupLabel(park);
  const Icon = ready ? Navigation : NavigationOff;
  return (
    <span
      title={label}
      aria-label={label}
      className={cn('inline-flex shrink-0 mr-2', ready ? 'text-primary' : 'text-amber-400')}
    >
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40',
        checked ? 'bg-primary' : 'bg-[#d1d5db]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-[#E6EBE6] shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function RenameModal({ park, onClose }: { park: AdminPark; onClose: () => void }) {
  const [name, setName] = useState(park.name);
  const rename = useRenamepark();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === park.name) { onClose(); return; }
    try {
      await rename.mutateAsync({ oldName: park.name, newName: trimmed });
      toast.success('Park renamed');
      onClose();
    } catch {
      toast.error('Failed to rename park');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        className="bg-card rounded-[20px] p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-foreground">Rename Park</h2>
          <button type="button" onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-muted">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">Park name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-[10px] px-3 h-10 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Renames across all {park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}.
        </p>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-border text-[13px] font-bold text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button type="submit" disabled={rename.isPending} className="flex-1 h-10 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold hover:bg-[color:var(--primary-dark)] disabled:opacity-50">
            {rename.isPending ? 'Saving…' : 'Rename'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteModal({ park, onClose }: { park: AdminPark; onClose: () => void }) {
  const deletePark = useDeletePark();

  const handleDelete = async () => {
    try {
      await deletePark.mutateAsync(park.name);
      toast.success('Park and all its trails deleted');
      onClose();
    } catch {
      toast.error('Failed to delete park');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-card rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-foreground text-center mb-2">Delete Park</h2>
        <p className="text-[13px] text-muted-foreground text-center leading-relaxed">
          Permanently delete <strong>{park.name}</strong> and all{' '}
          <strong>{park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}</strong>, including all reports?
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-border text-[13px] font-bold text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deletePark.isPending} className="flex-1 h-10 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-50">
            {deletePark.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminParksPage() {
  const navigate = useNavigate();
  const { data: parks, isLoading } = useAdminParks();
  const [deleting, setDeleting] = useState<AdminPark | null>(null);
  const toggleVisibility = useToggleParkVisibility();

  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const missingLocation = (parks ?? []).filter((p) => !hasLocation(p)).length;
  const missingDirections = (parks ?? []).filter((p) => !hasDirections(p)).length;
  const missingInfo = (parks ?? []).filter((p) => !hasLocation(p) || !hasDirections(p)).length;
  const filtered = (parks ?? []).filter((p) => {
    if (missingOnly && hasLocation(p) && hasDirections(p)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const regionLabel = parkRegionLabel(p).toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.city?.toLowerCase().includes(q) ?? false) ||
      regionLabel.includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false) ||
      (p.description_es?.toLowerCase().includes(q) ?? false)
    );
  });
  const { page, setPage, pageCount, pageItems, total, pageSize, from, to } =
    useAdminPagination(filtered, `${search}|${missingOnly}`);
  const allHidden = (parks ?? []).length > 0 && (parks ?? []).every((p) => p.isHidden);

  const handleToggle = async (park: AdminPark) => {
    const next = !park.isHidden;
    try {
      await toggleVisibility.mutateAsync({ name: park.name, isHidden: next });
      toast.success(next ? `"${park.name}" hidden from app` : `"${park.name}" is now visible`);
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleToggleAll = async () => {
    const nextHidden = !allHidden;
    const list = parks ?? [];
    try {
      await Promise.all(
        list.map((p) => toggleVisibility.mutateAsync({ name: p.name, isHidden: nextHidden }))
      );
      toast.success(nextHidden ? 'All parks hidden' : 'All parks visible');
    } catch {
      toast.error('Failed to update all parks');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-foreground">Parks</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {isLoading || !(parks ?? []).length
              ? 'Toggle visibility to show or hide parks from the app'
              : missingLocation === 0 && missingDirections === 0
                ? 'Every park has a location and directions.'
                : [
                    missingLocation ? `${missingLocation} without a location` : null,
                    missingDirections ? `${missingDirections} without directions` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/parks/new')}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-primary text-primary-foreground text-[13px] font-bold hover:bg-[color:var(--primary-dark)] transition-colors"
          >
            <Plus className="size-3.5" />
            New Park
          </button>
        </div>
      </div>
      {!isLoading && (parks ?? []).length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parks…"
            className="border border-border rounded-[10px] px-3 h-9 text-[13px] text-muted-foreground bg-card focus:outline-none w-[200px]"
          />
          <button
            type="button"
            onClick={() => setMissingOnly((on) => !on)}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-colors',
              missingOnly
                ? 'bg-amber-400 text-primary-foreground border-amber-400'
                : 'bg-card text-muted-foreground border-border hover:border-amber-400 hover:text-amber-300'
            )}
          >
            Missing info{missingInfo > 0 ? ` ${missingInfo}` : ''}
          </button>
          <button
            onClick={handleToggleAll}
            disabled={toggleVisibility.isPending}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-colors disabled:opacity-50',
              allHidden
                ? 'bg-primary text-primary-foreground border-primary hover:bg-[color:var(--primary-dark)]'
                : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'
            )}
          >
            {allHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {allHidden ? 'Show all' : 'Hide all'}
          </button>
        </div>
      )}

      <div className="bg-card rounded-[16px] border border-border overflow-hidden">
        <div className="grid grid-cols-[minmax(150px,1.1fr)_110px_minmax(200px,1.5fr)_70px_90px_110px] px-5 py-3 border-b border-border bg-secondary">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground">Park Name</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground">Region</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground pr-4">Description</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground text-right">Trails</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground text-center">Visible</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-muted-foreground text-right">Actions</p>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-muted-foreground">
            {search
              ? `No parks matching "${search}"`
              : missingOnly
                ? 'Every park has a location and directions.'
                : 'No parks found.'}
          </div>
        )}

        {pageItems.map((park, i) => (
          <div
            key={park.name}
            className={cn(
              'grid grid-cols-[minmax(150px,1.1fr)_110px_minmax(200px,1.5fr)_70px_90px_110px] px-5 py-3.5 items-center transition-opacity',
              i !== pageItems.length - 1 ? 'border-b border-border' : '',
              park.isHidden ? 'opacity-50' : ''
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-4">
              {park.isHidden && <EyeOff className="size-3.5 text-muted-foreground shrink-0" />}
              <ParkSetupIcon park={park} />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground truncate">{park.name}</p>
                {park.city && <p className="text-[12px] text-muted-foreground truncate">{park.city}</p>}
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground truncate pr-3">
              {parkRegionLabel(park)}
            </p>
            <div className="min-w-0 pr-4">
              {park.description ? (
                <p className="text-[13px] text-muted-foreground line-clamp-2" title={park.description}>
                  {park.description}
                </p>
              ) : (
                <p className="text-[13px] text-muted-foreground">—</p>
              )}
              {park.description_es ? (
                <p
                  className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1"
                  title={park.description_es}
                >
                  ES: {park.description_es}
                </p>
              ) : null}
            </div>
            <p className="text-[13px] text-muted-foreground text-right">{park.trailCount}</p>
            <div className="flex justify-center">
              <Toggle
                checked={!park.isHidden}
                onChange={() => handleToggle(park)}
                disabled={toggleVisibility.isPending}
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => navigate(`/admin/parks/${encodeURIComponent(park.name)}/edit`)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => setDeleting(park)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

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

      {deleting && <DeleteModal park={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
