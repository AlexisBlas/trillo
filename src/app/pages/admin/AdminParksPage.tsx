import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil, Trash2, X, AlertTriangle, Eye, EyeOff, Plus } from 'lucide-react';
import { useAdminParks, useRenamepark, useDeletePark, useToggleParkVisibility, AdminPark } from '../../hooks/useAdminData';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

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
        checked ? 'bg-[#2c4a1e]' : 'bg-[#d1d5db]'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
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
        className="bg-white rounded-[20px] p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Rename Park</h2>
          <button type="button" onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-[#f0ede6]">
            <X className="size-4 text-[#4b5563]" />
          </button>
        </div>
        <label className="block text-[12px] font-bold text-[#374151] mb-1.5">Park name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[#e5e0d5] rounded-[10px] px-3 h-10 text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#2c4a1e]/30"
        />
        <p className="text-[11px] text-[#687588] mt-1.5">
          Renames across all {park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}.
        </p>
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#e5e0d5] text-[13px] font-bold text-[#374151] hover:bg-[#f0ede6]">
            Cancel
          </button>
          <button type="submit" disabled={rename.isPending} className="flex-1 h-10 rounded-[10px] bg-[#2c4a1e] text-white text-[13px] font-bold hover:bg-[#1a3010] disabled:opacity-50">
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
      <div className="bg-white rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-[#1a1a1a] text-center mb-2">Delete Park</h2>
        <p className="text-[13px] text-[#374151] text-center leading-relaxed">
          Permanently delete <strong>{park.name}</strong> and all{' '}
          <strong>{park.trailCount} trail{park.trailCount !== 1 ? 's' : ''}</strong>, including all reports?
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#e5e0d5] text-[13px] font-bold text-[#374151] hover:bg-[#f0ede6]">
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
  const filtered = (parks ?? []).filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const allHidden = (parks ?? []).length > 0 && (parks ?? []).every((p) => p.isHidden);
  const allVisible = (parks ?? []).length > 0 && (parks ?? []).every((p) => !p.isHidden);

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
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">Parks</h1>
          <p className="text-[14px] text-[#687588] mt-1">Toggle visibility to show or hide parks from the app</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/parks/new')}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[#2c4a1e] text-white text-[13px] font-bold hover:bg-[#1a3010] transition-colors"
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
            className="border border-[#e5e0d5] rounded-[10px] px-3 h-9 text-[13px] text-[#374151] bg-white focus:outline-none w-[200px]"
          />
          <button
            onClick={handleToggleAll}
            disabled={toggleVisibility.isPending}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded-[10px] text-[13px] font-bold border transition-colors disabled:opacity-50',
              allHidden
                ? 'bg-[#2c4a1e] text-white border-[#2c4a1e] hover:bg-[#1a3010]'
                : 'bg-white text-[#374151] border-[#e5e0d5] hover:border-[#2c4a1e] hover:text-[#2c4a1e]'
            )}
          >
            {allHidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {allHidden ? 'Show all' : 'Hide all'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#e5e0d5] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_100px_120px] px-5 py-3 border-b border-[#f0ede6] bg-[#fafaf8]">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#687588]">Park Name</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#687588] text-right">Trails</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#687588] text-center">Visible</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#687588] text-right">Actions</p>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-[13px] text-[#687588]">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-[#687588]">
            {search ? `No parks matching "${search}"` : 'No parks found.'}
          </div>
        )}

        {filtered.map((park, i) => (
          <div
            key={park.name}
            className={cn(
              'grid grid-cols-[1fr_80px_100px_120px] px-5 py-3.5 items-center transition-opacity',
              i !== filtered.length - 1 ? 'border-b border-[#f0ede6]' : '',
              park.isHidden ? 'opacity-50' : ''
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-4">
              {park.isHidden && <EyeOff className="size-3.5 text-[#687588] shrink-0" />}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1a1a1a] truncate">{park.name}</p>
                {park.city && <p className="text-[12px] text-[#687588] truncate">{park.city}</p>}
              </div>
            </div>
            <p className="text-[13px] text-[#687588] text-right">{park.trailCount}</p>
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
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#f0ede6] text-[#687588] hover:text-[#2c4a1e] transition-colors"
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => setDeleting(park)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#687588] hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleting && <DeleteModal park={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
