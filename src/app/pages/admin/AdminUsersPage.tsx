import { useState } from 'react';
import { Shield, ShieldOff, Ban, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import {
  useAdminUsers,
  useUpdateProfile,
  useDeleteUser,
  AdminUser,
} from '../../hooks/useAdminData';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AdminTablePagination, useAdminPagination } from './AdminTablePagination';

function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-[#151C18] rounded-[20px] p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className={`size-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-[#24302A]'}`}>
          <AlertTriangle className={`size-6 ${danger ? 'text-red-500' : 'text-[#63B882]'}`} />
        </div>
        <h2 className="text-[16px] font-bold text-[#E6EBE6] text-center mb-2">{title}</h2>
        <p className="text-[13px] text-[#9AA39C] text-center leading-relaxed">{description}</p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 h-10 rounded-[10px] border border-[#24302A] text-[13px] font-bold text-[#9AA39C] hover:bg-[#24302A]">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-[10px] text-white text-[13px] font-bold ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#63B882] hover:bg-[#52A06E]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type PendingAction =
  | { type: 'ban'; user: AdminUser }
  | { type: 'unban'; user: AdminUser }
  | { type: 'promote'; user: AdminUser }
  | { type: 'demote'; user: AdminUser }
  | { type: 'delete'; user: AdminUser };

export function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const { user: me } = useAuth();
  const update = useUpdateProfile();
  const remove = useDeleteUser();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [search, setSearch] = useState('');

  const filtered = (users ?? []).filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const { page, setPage, pageCount, pageItems, total, pageSize, from, to } =
    useAdminPagination(filtered, search);

  const handleConfirm = async () => {
    if (!pending) return;
    const { type, user } = pending;
    setPending(null);
    try {
      if (type === 'ban') await update.mutateAsync({ id: user.id, updates: { is_banned: true } });
      else if (type === 'unban') await update.mutateAsync({ id: user.id, updates: { is_banned: false } });
      else if (type === 'promote') await update.mutateAsync({ id: user.id, updates: { is_admin: true } });
      else if (type === 'demote') await update.mutateAsync({ id: user.id, updates: { is_admin: false } });
      else if (type === 'delete') {
        await remove.mutateAsync(user.id);
        toast.success('User deleted');
        return;
      }
      toast.success('User updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      toast.error(
        type === 'delete'
          ? message || 'Failed to delete user'
          : 'Failed to update user'
      );
    }
  };

  const confirmProps = (): { title: string; description: string; confirmLabel: string; danger?: boolean } => {
    if (!pending) return { title: '', description: '', confirmLabel: '' };
    const email = pending.user.email ?? 'this user';
    switch (pending.type) {
      case 'ban':
        return {
          title: 'Ban User',
          description: `Ban ${email}? They will no longer be able to submit reports.`,
          confirmLabel: 'Ban',
          danger: true,
        };
      case 'unban':
        return {
          title: 'Unban User',
          description: `Restore access for ${email}?`,
          confirmLabel: 'Unban',
        };
      case 'promote':
        return {
          title: 'Grant Admin',
          description: `Give admin access to ${email}? They will be able to manage all parks, trails, and users.`,
          confirmLabel: 'Grant Admin',
        };
      case 'demote':
        return {
          title: 'Revoke Admin',
          description: `Revoke admin access from ${email}?`,
          confirmLabel: 'Revoke',
          danger: true,
        };
      case 'delete':
        return {
          title: 'Delete User',
          description: `Permanently delete ${email}? Their account and follows will be removed. Trail reports stay on the map as anonymous.`,
          confirmLabel: 'Delete',
          danger: true,
        };
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#E6EBE6]">Users</h1>
          <p className="text-[14px] text-[#8B958C] mt-1">{users?.length ?? 0} registered</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="border border-[#24302A] rounded-[10px] px-3 h-9 text-[13px] text-[#9AA39C] bg-[#151C18] focus:outline-none w-[220px]"
        />
      </div>

      <div className="bg-[#151C18] rounded-[16px] border border-[#24302A] overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_148px] px-5 py-3 border-b border-[#24302A] bg-[#1A221C]">
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C]">Email</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-center">Reports</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-center">Role</p>
          <p className="text-[11px] font-bold tracking-[1px] uppercase text-[#8B958C] text-right">Actions</p>
        </div>

        {isLoading && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">Loading…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-[#8B958C]">No users found.</div>
        )}

        {pageItems.map((user, i) => {
          const isSelf = user.id === me?.id;
          return (
            <div
              key={user.id}
              className={`grid grid-cols-[1fr_80px_80px_148px] px-5 py-3.5 items-center ${i !== pageItems.length - 1 ? 'border-b border-[#24302A]' : ''} ${user.is_banned ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0 pr-4">
                <p className="text-[13.5px] font-semibold text-[#E6EBE6] truncate">{user.email ?? '—'}</p>
                <p className="text-[11px] text-[#8B958C] mt-0.5">
                  Joined {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                  {isSelf && <span className="ml-1.5 text-[#63B882] font-bold">· you</span>}
                </p>
              </div>

              <p className="text-[13px] text-[#8B958C] text-center">{user.report_count}</p>

              <div className="flex justify-center">
                {user.is_admin ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#63B882] bg-[#63B882]/10 px-2 py-0.5 rounded-full">
                    <Shield className="size-3" /> Admin
                  </span>
                ) : user.is_banned ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    <Ban className="size-3" /> Banned
                  </span>
                ) : (
                  <span className="text-[11px] text-[#8B958C]">User</span>
                )}
              </div>

              <div className="flex justify-end gap-1.5">
                {!isSelf && (
                  <>
                    {user.is_banned ? (
                      <button
                        onClick={() => setPending({ type: 'unban', user })}
                        title="Unban"
                        className="size-8 flex items-center justify-center rounded-[8px] hover:bg-green-50 text-[#8B958C] hover:text-green-600 transition-colors"
                      >
                        <CheckCircle className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPending({ type: 'ban', user })}
                        title="Ban"
                        className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
                      >
                        <Ban className="size-3.5" />
                      </button>
                    )}
                    {user.is_admin ? (
                      <button
                        onClick={() => setPending({ type: 'demote', user })}
                        title="Revoke admin"
                        className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
                      >
                        <ShieldOff className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPending({ type: 'promote', user })}
                        title="Grant admin"
                        className="size-8 flex items-center justify-center rounded-[8px] hover:bg-[#24302A] text-[#8B958C] hover:text-[#63B882] transition-colors"
                      >
                        <Shield className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setPending({ type: 'delete', user })}
                      title="Delete user"
                      className="size-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-[#8B958C] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
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

      {pending && (
        <ConfirmModal
          {...confirmProps()}
          onConfirm={handleConfirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
