import { useState } from 'react';
import { Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminReports, useUpdateReport, useDeleteReport, useDeleteAllReports, useAdminStats, useAdminTrails, AdminReport } from '../../hooks/useAdminData';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  green: 'Dry',
  yellow: 'Wet',
  red: 'Muddy',
};

function EditModal({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const { data: trails } = useAdminTrails();
  const update = useUpdateReport();
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.notes ?? '');
  const [trailId, setTrailId] = useState(report.trail_id ?? '');

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        id: report.id,
        updates: {
          status,
          notes: notes.trim() || null,
          ...(trailId ? { trail_id: trailId } : {}),
        },
      });
      toast.success('Report updated');
      onClose();
    } catch {
      toast.error('Failed to update report');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-[#F2F5F2]">Edit Report</h2>
          <button onClick={onClose} className="size-7 flex items-center justify-center rounded-full hover:bg-[#24302A]">
            <X className="size-4 text-[#8B958C]" />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-2">Status</label>
          <div className="flex gap-2">
            {(['green', 'yellow', 'red'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'flex-1 h-9 rounded-[10px] text-[13px] font-bold border-[1.5px] transition-colors',
                  status === s
                    ? s === 'green' ? 'bg-green-600 text-white border-green-600'
                      : s === 'yellow' ? 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-red-500 text-white border-red-500'
                    : 'bg-[#151C18] text-[#9AA39C] border-[#24302A] hover:border-[#5EE08A]'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Move to trail */}
        <div className="mb-4">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">Trail</label>
          <select
            value={trailId}
            onChange={(e) => setTrailId(e.target.value)}
            className="w-full border border-[#24302A] rounded-[10px] px-3 h-10 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none"
          >
            <option value="">Park overview / none</option>
            {(trails ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-[12px] font-bold text-[#9AA39C] mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-[#24302A] rounded-[10px] px-3 py-2.5 text-[13px] text-[#F2F5F2] resize-none focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex-1 h-10 rounded-[10px] bg-[#5EE08A] text-[#0E1510] text-[13px] font-bold hover:bg-[#4ADE80] disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAllModal({ count, onClose }: { count: number; onClose: () => void }) {
  const del = useDeleteAllReports();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-[#F2F5F2] text-center mb-2">Delete all reports</h2>
        <p className="text-[13px] text-[#9AA39C] text-center">
          Permanently delete <strong>{count}</strong> {count === 1 ? 'report' : 'reports'}? They will disappear from the map and this cannot be undone.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                const deleted = await del.mutateAsync();
                toast.success(deleted === 1 ? '1 report deleted' : `${deleted} reports deleted`);
                onClose();
              } catch {
                toast.error('Failed to delete reports');
              }
            }}
            disabled={del.isPending || count === 0}
            className="flex-1 h-10 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-50"
          >
            {del.isPending ? 'Deleting…' : 'Delete all'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const del = useDeleteReport();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-bold text-[#F2F5F2] text-center mb-2">Delete Report</h2>
        <p className="text-[13px] text-[#9AA39C] text-center">
          Delete this <strong>{report.status}</strong> report on <strong>{report.trail_name}</strong>?
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                await del.mutateAsync(report.id);
                toast.success('Report deleted');
                onClose();
              } catch {
                toast.error('Failed to delete');
              }
            }}
            disabled={del.isPending}
            className="flex-1 h-10 rounded-[10px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 disabled:opacity-50"
          >
            {del.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  const { data: reports, isLoading, error } = useAdminReports();
  const { data: stats } = useAdminStats();
  const totalReports = stats?.reports ?? reports?.length ?? 0;
  const [editing, setEditing] = useState<AdminReport | null>(null);
  const [deleting, setDeleting] = useState<AdminReport | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = (reports ?? []).filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.trail_name.toLowerCase().includes(q) ||
        r.trail_location?.toLowerCase().includes(q) ||
        r.park_name?.toLowerCase().includes(q) ||
        r.user_email?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });
  const { page, setPage, pageCount, pageItems, total, pageSize, from, to } =
    useAdminPagination(filtered, `${search}|${statusFilter}`);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#F2F5F2]">Reports</h1>
          <p className="text-[14px] text-[#8B958C] mt-1">{totalReports} total</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={totalReports === 0}
            className="h-9 px-3 rounded-[10px] border border-red-500/40 text-[13px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            Delete all
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="green">Green</option>
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
        </div>
      </div>

      <div className="bg-[#151C18] rounded-[16px] border border-[#24302A] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_80px_120px_80px] px-5 py-3 border-b border-[#24302A] bg-[#1A221C]">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Trail</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">User</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-center">Status</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-center">Date</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-right">Actions</p>
        </div>

        {isLoading && <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">Loading…</div>}
        {!isLoading && error && (
          <div className="px-5 py-12 text-center text-[13px] text-red-600">
            Failed to load reports{error instanceof Error ? `: ${error.message}` : '.'}
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">No reports found.</div>
        )}

        {pageItems.map((report, i) => (
          <div
            key={report.id}
            className={cn('grid grid-cols-[1fr_1fr_80px_120px_80px] px-5 py-3 items-center', i < pageItems.length - 1 && 'border-b border-[#24302A]')}
          >
            <div className="min-w-0 pr-3">
              <p className="text-[13px] font-semibold text-[#F2F5F2] truncate">{report.trail_name}</p>
              <p className="text-[11px] text-[#8B958C] truncate">
                {report.trail_id ? (report.trail_location ?? '—') : 'Park overview'}
              </p>
            </div>
            <p className="text-[12px] text-[#8B958C] truncate pr-3">
              {report.user_email ?? 'Anonymous'}
            </p>
            <div className="flex justify-center">
              <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[report.status])}>
                {STATUS_LABELS[report.status]}
              </span>
            </div>
            <p className="text-[12px] text-[#8B958C] text-center">
              {format(new Date(report.created_at), 'MMM d, yyyy')}
            </p>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setEditing(report)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#24302A] text-[#8B958C] hover:text-[#5EE08A] transition-colors"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => setDeleting(report)}
                className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
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

      {editing && <EditModal report={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteModal report={deleting} onClose={() => setDeleting(null)} />}
      {confirmDeleteAll && (
        <DeleteAllModal count={totalReports} onClose={() => setConfirmDeleteAll(false)} />
      )}
    </div>
  );
}
