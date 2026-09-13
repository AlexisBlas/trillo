import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil, Trash2, X, AlertTriangle, Eye, EyeOff, Plus } from 'lucide-react';
import { useAdminParks, useRenamepark, useDeletePark, useToggleParkVisibility, AdminPark } from '../../hooks/useAdminData';
import {
  getCityRegion,
  isParkRegion,
  PARK_REGION_LABELS,
} from '../../lib/regions';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

function parkRegionLabel(park: AdminPark): string {
  const region = isParkRegion(park.region)
    ? park.region
    : getCityRegion(park.city);
  return region ? PARK_REGION_LABELS[region] : '—';
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
        checked ? 'bg-[#5EE08A]' : 'bg-[#d1d5db]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-[#F2F5F2] shadow-sm transition-transform duration-200',
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
        className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[#F2F5F2]">Rename Park</h2>
          <button type="button" onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-[#24302A]">
            <X className="size-4 text-[#8B958C]" />
          </button>
        </div>
        <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">Park name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[14px] text-[#F2F5F2] focus:outline-none focus:ring-2 focus:ring-[#5EE08A]/30"
        />
        <p className="text-[11px] text-[#8B958C] mt-1.5">
          Renames across all {park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}.
        </p>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button type="submit" disabled={rename.isPending} className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] disabled:opacity-50">
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
      <div className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-[#F2F5F2] text-center mb-2">Delete Park</h2>
        <p className="text-[13px] text-[#9AA39C] text-center leading-relaxed">
          Permanently delete <strong>{park.name}</strong> and all{' '}
          <strong>{park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}</strong>, including all reports?
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
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
  const filtered = (parks ?? []).filter((p) => {
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
    useAdminPagination(filtered, search);
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
          <h1 className="text-[24px] font-bold text-[#F2F5F2]">Parks</h1>
          <p className="text-[14px] text-[#8B958C] mt-1">Toggle visibility to show or hide parks from the app</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/parks/new')}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] transition-colors"
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
            className="border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none w-[200px]"
          />
          <button
            onClick={handleToggleAll}
            disabled={toggleVisibility.isPending}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-colors disabled:opacity-50',
              allHidden
                ? 'bg-[#5EE08A] text-[#0E1510] border-[#5EE08A] hover:bg-[#4ADE80]'
                : 'bg-[#151C18] text-[#9AA39C] border-[#24302A] hover:border-[#5EE08A] hover:text-[#5EE08A]'
            )}
          >
            {allHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {allHidden ? 'Show all' : 'Hide all'}
          </button>
        </div>
      )}

      <div className="bg-[#151C18] rounded-[16px] border border-[#24302A] overflow-hidden">
        <div className="grid grid-cols-[minmax(150px,1.1fr)_110px_minmax(200px,1.5fr)_70px_90px_110px] px-5 py-3 border-b border-[#24302A] bg-[#1A221C]">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Park Name</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Region</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] pr-4">Description</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-right">Trails</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-center">Visible</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-right">Actions</p>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">
            {search ? `No parks matching "${search}"` : 'No parks found.'}
          </div>
        )}

        {pageItems.map((park, i) => (
          <div
            key={park.name}
            className={cn(
              'grid grid-cols-[minmax(150px,1.1fr)_110px_minmax(200px,1.5fr)_70px_90px_110px] px-5 py-3.5 items-center transition-opacity',
              i !== pageItems.length - 1 ? 'border-b border-[#24302A]' : '',
              park.isHidden ? 'opacity-50' : ''
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-4">
              {park.isHidden && <EyeOff className="size-3.5 text-[#8B958C] shrink-0" />}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#F2F5F2] truncate">{park.name}</p>
                {park.city && <p className="text-[12px] text-[#8B958C] truncate">{park.city}</p>}
              </div>
            </div>
            <p className="text-[13px] text-[#9AA39C] truncate pr-3">
              {parkRegionLabel(park)}
            </p>
            <div className="min-w-0 pr-4">
              {park.description ? (
                <p className="text-[13px] text-[#9AA39C] line-clamp-2" title={park.description}>
                  {park.description}
                </p>
              ) : (
                <p className="text-[13px] text-[#8B958C]">—</p>
              )}
              {park.description_es ? (
                <p
                  className="text-[11px] text-[#8B958C] mt-0.5 line-clamp-1"
                  title={park.description_es}
                >
                  ES: {park.description_es}
                </p>
              ) : null}
            </div>
            <p className="text-[13px] text-[#8B958C] text-right">{park.trailCount}</p>
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
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#24302A] text-[#8B958C] hover:text-[#5EE08A] transition-colors"
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => setDeleting(park)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
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
