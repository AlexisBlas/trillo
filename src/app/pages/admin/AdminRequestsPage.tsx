import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check, Trash2, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  usePlaceRequests,
  useUpdatePlaceRequest,
  useDeletePlaceRequest,
  PlaceRequest,
} from '../../hooks/useAdminData';
import { cn } from '../../components/ui/utils';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

type Filter = 'open' | 'all' | 'done' | 'dismissed';

export function AdminRequestsPage() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = usePlaceRequests();
  const update = useUpdatePlaceRequest();
  const remove = useDeletePlaceRequest();
  const [filter, setFilter] = useState<Filter>('open');

  const filtered = (requests ?? []).filter((r) =>
    filter === 'all' ? true : r.status === filter
  );
  const { page, setPage, pageCount, pageItems, total, pageSize, from, to } =
    useAdminPagination(filtered, filter);
  const openCount = (requests ?? []).filter((r) => r.status === 'open').length;

  const setStatus = async (req: PlaceRequest, status: PlaceRequest['status']) => {
    try {
      await update.mutateAsync({ id: req.id, status });
      toast.success(status === 'done' ? 'Marked done' : status === 'dismissed' ? 'Dismissed' : 'Reopened');
    } catch {
      toast.error('Failed to update request');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Request deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const goAddFromRequest = (req: PlaceRequest) => {
    navigate('/admin/parks/new', {
      state: {
        fromRequest: {
          id: req.id,
          kind: req.kind,
          name: req.name,
          details: req.details,
        },
      },
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a] flex items-center gap-2.5">
            <Bell className="size-5 text-[#2c4a1e]" />
            Requests
            {openCount > 0 && (
              <span className="text-[12px] font-bold bg-[#ef4444] text-white px-2 py-0.5 rounded-full">
                {openCount} open
              </span>
            )}
          </h1>
          <p className="text-[14px] text-[#687588] mt-1">
            Park and trail add requests from users
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          { value: 'open' as const, label: 'Open' },
          { value: 'all' as const, label: 'All' },
          { value: 'done' as const, label: 'Done' },
          { value: 'dismissed' as const, label: 'Dismissed' },
        ]).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'h-9 px-3.5 rounded-[10px] text-[13px] font-bold border-[1.5px] transition-colors',
              filter === opt.value
                ? 'bg-[#2c4a1e] text-white border-[#2c4a1e]'
                : 'bg-white text-[#374151] border-[#e5e0d5] hover:border-[#2c4a1e]'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[88px] bg-white rounded-[16px] border border-[#e5e0d5] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-[#e5e0d5] p-10 text-center">
          <p className="text-[14px] text-[#687588]">
            {filter === 'open' ? 'No open requests.' : 'No requests in this filter.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pageItems.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-[16px] border border-[#e5e0d5] p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-[11px] font-bold tracking-[0.8px] uppercase px-2 py-0.5 rounded-full',
                      req.kind === 'park'
                        ? 'bg-[#ecfdf5] text-[#065f46]'
                        : 'bg-[#f0fdf4] text-[#166534]'
                    )}
                  >
                    {req.kind}
                  </span>
                  {req.status !== 'open' && (
                    <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-[#687588]">
                      {req.status}
                    </span>
                  )}
                </div>
                <p className="text-[16px] font-bold text-[#1a1a1a] mt-1.5">{req.name}</p>
                {req.details && (
                  <p className="text-[13px] text-[#374151] mt-1 leading-[19px]">{req.details}</p>
                )}
                <p className="text-[12px] text-[#687588] mt-2">
                  {format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}
                  {req.user_email ? ` · ${req.user_email}` : ' · Guest'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => goAddFromRequest(req)}
                  className="h-9 px-3 rounded-[10px] text-[12px] font-bold border-[1.5px] border-[#2c4a1e] text-[#2c4a1e] bg-white flex items-center gap-1.5 hover:bg-[#f0ede6]"
                >
                  <Plus className="size-3.5" />
                  {req.kind === 'park' ? 'Add park' : 'Add trail'}
                </button>
                {req.status === 'open' ? (
                  <>
                    <button
                      onClick={() => setStatus(req, 'done')}
                      className="h-9 px-3 rounded-[10px] text-[12px] font-bold bg-[#2c4a1e] text-white flex items-center gap-1.5"
                    >
                      <Check className="size-3.5" />
                      Done
                    </button>
                    <button
                      onClick={() => setStatus(req, 'dismissed')}
                      className="h-9 px-3 rounded-[10px] text-[12px] font-bold border-[1.5px] border-[#e5e0d5] text-[#374151] flex items-center gap-1.5"
                    >
                      <X className="size-3.5" />
                      Dismiss
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setStatus(req, 'open')}
                    className="h-9 px-3 rounded-[10px] text-[12px] font-bold border-[1.5px] border-[#e5e0d5] text-[#374151]"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => handleDelete(req.id)}
                  className="size-9 rounded-[10px] border-[1.5px] border-[#e5e0d5] text-[#991b1b] flex items-center justify-center hover:bg-red-50"
                  aria-label="Delete request"
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
            className="rounded-[16px] border border-[#e5e0d5] bg-white"
          />
        </div>
      )}
    </div>
  );
}
