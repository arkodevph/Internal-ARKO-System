"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@arko/ui";
import dynamic from "next/dynamic";

const OpenPeepsAvatar = dynamic(
  () =>
    import("../../../components/open-peeps-avatar").then((m) => ({
      default: m.OpenPeepsAvatar,
    })),
  { ssr: false },
);
import {
  Users as UsersIcon,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Trash2,
  Loader2,
  AlertCircle,
  UserPlus,
  X,
  Check,
  UserCog,
  Ban,
  Copy,
  CheckCheck,
  Phone,
  Mail,
  Pencil,
  KeyRound,
  RefreshCw,
  BriefcaseBusiness,
  Calculator,
  Eye,
  BookOpen,
} from "lucide-react";
import { api } from "../../../lib/trpc/client";
import { generateAvatarSeed, avatarConfigToJson } from "../../../lib/avatar";
import { formatPresence } from "../../../lib/presence";
import {
  PERMISSION_GROUPS,
  defaultPermissionsForRole,
  resolvePermissions,
  type Permission,
} from "../../../lib/rbac";

type RolePreset = keyof typeof roleConfig;

const roleConfig = {
  ADMIN: { label: "Admin", color: "bg-red-50 text-red-700", icon: ShieldAlert },
  ACCOUNTANT: {
    label: "Accountant",
    color: "bg-emerald-50 text-emerald-700",
    icon: Calculator,
  },
  MEMBER: {
    label: "Member",
    color: "bg-primary-50 text-primary-700",
    icon: ShieldCheck,
  },
  USER: { label: "User", color: "bg-card text-text-secondary", icon: Shield },
  CLIENT: {
    label: "Client",
    color: "bg-blue-500/10 text-blue-400",
    icon: BriefcaseBusiness,
  },
  INTERN: { label: "Intern", color: "bg-card text-text-secondary", icon: BookOpen },
  DEMO: { label: "Demo", color: "bg-amber-500/10 text-amber-400", icon: Eye },
};

const statusConfig = {
  ACTIVE: { label: "Active", color: "bg-finance-50 text-finance-600" },
  RESTRICTED: { label: "Restricted", color: "bg-orange-50 text-orange-600" },
  SUSPENDED: { label: "Suspended", color: "bg-red-50 text-red-600" },
};

// ── Helpers ─────────────────────────────────────────────

function slugify(first: string, last: string) {
  return `${first}${last}`.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;
  const parts = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = parts.length; i < 14; i++)
    parts.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts.join("");
}

function UserAvatar({
  name,
  email,
  image,
  id,
  avatar,
  size = "md",
}: {
  name: string | null;
  email: string;
  image: string | null;
  id?: string;
  avatar?: unknown;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36;

  return (
    <OpenPeepsAvatar
      userId={id}
      avatarJson={avatar ? JSON.stringify(avatar) : undefined}
      size={px}
    />
  );
}

// ── Main Page ───────────────────────────────────────────

export default function UsersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | RolePreset>("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | keyof typeof statusConfig
  >("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{
    id: string;
    name: string;
    phone: string | null;
    title: string | null;
  } | null>(null);
  const [showAccessModal, setShowAccessModal] = useState<{
    id: string;
    name: string;
    role: RolePreset;
    permissions: unknown;
    status: keyof typeof statusConfig;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const utils = api.useUtils();

  const {
    data: users,
    isLoading,
    error,
  } = api.users.list.useQuery({ query: search || undefined });
  const [resetPasswordData, setResetPasswordData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const updateStatus = api.users.updateStatus.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });
  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      setConfirmDelete(null);
      setDeleteError(null);
      utils.users.list.invalidate();
    },
    onError: (err) => {
      setDeleteError(err.message);
    },
  });
  const resetPasswordMut = api.users.resetPassword.useMutation({
    onSuccess: (data) => {
      setResetPasswordResult({
        email: data.email,
        password: data.generatedPassword,
      });
      setResetPasswordData(null);
    },
  });
  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });

  const filteredUsers = (users ?? []).filter(
    (user) =>
      (roleFilter === "ALL" || user.role === roleFilter) &&
      (statusFilter === "ALL" || user.status === statusFilter),
  );

  return (
    <div className="users-reference mx-auto flex h-full w-full max-w-[1500px] flex-col">
      {/* Header */}
      <div className="mb-5 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-400">
            Users / User Management
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            User Management
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Manage roles, access, account status, and team activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-text-tertiary">
            <UsersIcon className="h-3 w-3" />
            {users?.length ?? 0} members
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-4 text-xs font-semibold text-white shadow-sm transition-transform active:scale-[0.97]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add User
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="users-toolbar mb-3 grid shrink-0 gap-2 md:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="relative">
          <span className="sr-only">Search users</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="users-control w-full pl-9 pr-3"
          />
        </label>
        <label>
          <span className="sr-only">Filter by role</span>
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as typeof roleFilter)
            }
            className="users-control w-full px-3"
          >
            <option value="ALL">All roles</option>
            {Object.entries(roleConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
            className="users-control w-full px-3"
          >
            <option value="ALL">All statuses</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 shrink-0 mb-3">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-800">
              Failed to load users
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2 flex-1 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filteredUsers.length === 0 && (
        <Card className="flex-1">
          <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <UsersIcon className="h-8 w-8 text-text-muted mb-2" />
            <p className="text-[12px] text-text-tertiary">
              {search ? "No users match your search" : "No users found"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* User list */}
      {!isLoading && !error && filteredUsers.length > 0 && (
        <div className="users-table min-h-0 flex-1 overflow-y-auto">
          <div className="users-table-head">
            <span>Profile</span>
            <span>Contact & activity</span>
            <span className="text-right">Access & actions</span>
          </div>
          {filteredUsers.map((user) => {
            const RoleIcon = roleConfig[user.role].icon;
            const isCurrentUser = user.id === session?.user?.id;
            const isRestricted =
              user.status === "RESTRICTED" || user.status === "SUSPENDED";

            return (
              <Card key={user.id} className="users-row overflow-hidden">
                <CardContent className="flex items-center gap-3 p-3">
                  {/* Avatar with profile pic */}
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    id={user.id}
                    avatar={user.avatar}
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[13px] font-medium truncate ${isRestricted ? "text-text-tertiary" : "text-text-primary"}`}
                      >
                        {user.name ?? "Unnamed"}
                        {isCurrentUser && (
                          <span className="ml-1 text-[10px] text-text-tertiary font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      {user.title && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-card px-2 py-0.5 text-[9px] font-medium text-text-secondary">
                          {user.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                      {(() => {
                        const presence = formatPresence(user.lastActiveAt);
                        return (
                          <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${presence.online ? "bg-pos" : "bg-text-tertiary"}`}
                            />
                            {presence.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Badges + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusConfig[user.status].color}`}
                    >
                      {user.status === "RESTRICTED" ? (
                        <Ban className="h-2.5 w-2.5" />
                      ) : user.status === "SUSPENDED" ? (
                        <ShieldBan className="h-2.5 w-2.5" />
                      ) : (
                        <Check className="h-2.5 w-2.5" />
                      )}
                      {statusConfig[user.status].label}
                    </span>

                    {/* Role */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${roleConfig[user.role].color}`}
                    >
                      <RoleIcon className="h-2.5 w-2.5" />
                      {roleConfig[user.role].label}
                    </span>

                    {/* Dropdown */}
                    {!isCurrentUser && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            if (openDropdown === user.id) {
                              setOpenDropdown(null);
                              return;
                            }
                            const r = e.currentTarget.getBoundingClientRect();
                            const menuHeight = 330;
                            let top = r.bottom + 4;
                            if (top + menuHeight > window.innerHeight) {
                              top = Math.max(8, r.top - menuHeight - 4);
                            }
                            setMenuPos({
                              top,
                              left: Math.max(8, r.right - 208),
                            });
                            setOpenDropdown(user.id);
                          }}
                          aria-label={`Manage ${user.name ?? user.email}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-white/[0.05] hover:text-text-secondary"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                        </button>

                        {openDropdown === user.id &&
                          menuPos &&
                          createPortal(
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenDropdown(null)}
                              />
                              <div
                                className="fixed z-50 w-52 rounded-xl border border-border-subtle bg-card p-2 shadow-xl"
                                style={{ top: menuPos.top, left: menuPos.left }}
                              >
                                {/* Edit profile */}
                                <div className="px-1 mb-1">
                                  <button
                                    onClick={() => {
                                      setShowEditModal({
                                        id: user.id,
                                        name: user.name ?? "",
                                        phone: user.phone,
                                        title: user.title,
                                      });
                                      setOpenDropdown(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-text-secondary hover:bg-card transition-colors"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit profile
                                  </button>
                                </div>
                                <div className="mb-1 px-1 flex flex-col gap-0.5">
                                  <button
                                    onClick={() => {
                                      setResetPasswordData({
                                        id: user.id,
                                        name: user.name ?? "",
                                        email: user.email,
                                      });
                                      setOpenDropdown(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-text-secondary hover:bg-card transition-colors"
                                  >
                                    <KeyRound className="h-3 w-3" />
                                    Reset password
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newConfig = avatarConfigToJson(
                                        generateAvatarSeed(user.id),
                                      );
                                      updateProfile.mutate({
                                        userId: user.id,
                                        avatar: newConfig,
                                      });
                                      setOpenDropdown(null);
                                    }}
                                    disabled={updateProfile.isPending}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-text-secondary hover:bg-card transition-colors"
                                  >
                                    {updateProfile.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3" />
                                    )}
                                    Reset avatar
                                  </button>
                                </div>

                                {/* Access */}
                                <div className="mb-1 px-1">
                                  <button
                                    onClick={() => {
                                      setShowAccessModal({
                                        id: user.id,
                                        name: user.name ?? user.email,
                                        role: user.role,
                                        permissions: user.permissions,
                                        status: user.status,
                                      });
                                      setOpenDropdown(null);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-text-secondary transition-colors hover:bg-card"
                                  >
                                    <UserCog className="h-3 w-3" />
                                    Edit access & permissions
                                  </button>
                                </div>

                                {/* Status toggle */}
                                <div className="border-t border-border-subtle mb-1 pt-1 px-1">
                                  <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                                    Status
                                  </p>
                                  {user.status === "ACTIVE" ? (
                                    <button
                                      onClick={() => {
                                        updateStatus.mutate({
                                          userId: user.id,
                                          status: "RESTRICTED",
                                        });
                                        setOpenDropdown(null);
                                      }}
                                      disabled={updateStatus.isPending}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-orange-600 hover:bg-orange-50 transition-colors"
                                    >
                                      {updateStatus.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Ban className="h-3 w-3" />
                                      )}
                                      Restrict user
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        updateStatus.mutate({
                                          userId: user.id,
                                          status: "ACTIVE",
                                        });
                                        setOpenDropdown(null);
                                      }}
                                      disabled={updateStatus.isPending}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-finance-600 hover:bg-finance-50 transition-colors"
                                    >
                                      {updateStatus.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                      Reactivate user
                                    </button>
                                  )}
                                </div>

                                {/* Delete */}
                                {confirmDelete !== user.id ? (
                                  <div className="border-t border-border-subtle pt-1 px-1">
                                    {deleteError && (
                                      <div className="mb-1.5 flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1.5">
                                        <AlertCircle className="h-3 w-3 shrink-0 text-red-500" />
                                        <p className="text-[9px] text-red-600">
                                          {deleteError}
                                        </p>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        setDeleteError(null);
                                        setConfirmDelete(user.id);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-red-600 hover:bg-neg-bg transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete user
                                    </button>
                                  </div>
                                ) : (
                                  <div className="border-t border-red-100 pt-1 px-1">
                                    <p className="text-[9px] text-red-500 mb-1 px-1">
                                      Delete {user.name ?? user.email}?
                                    </p>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          deleteUser.mutate({
                                            userId: user.id,
                                          });
                                          setOpenDropdown(null);
                                        }}
                                        disabled={deleteUser.isPending}
                                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-500 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-red-600 transition-colors"
                                      >
                                        {deleteUser.isPending ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3" />
                                        )}
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="flex-1 rounded-lg bg-card px-2 py-1.5 text-[10px] font-medium text-text-secondary hover:bg-card/[0.04] transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>,
                            document.body,
                          )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}
      {showEditModal && (
        <EditProfileModal
          userId={showEditModal.id}
          initialName={showEditModal.name}
          initialPhone={showEditModal.phone ?? ""}
          initialTitle={showEditModal.title}
          onClose={() => setShowEditModal(null)}
        />
      )}
      {showAccessModal && (
        <EditAccessModal
          user={showAccessModal}
          onClose={() => setShowAccessModal(null)}
        />
      )}
      {resetPasswordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-primary">
                Reset Password
              </h2>
              <button
                onClick={() => setResetPasswordData(null)}
                className="rounded-lg p-1 text-text-tertiary hover:bg-card transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[12px] text-text-secondary mb-4">
              Generate a new password for{" "}
              <strong>{resetPasswordData.name}</strong> (
              {resetPasswordData.email})?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setResetPasswordData(null)}
                className="flex-1 rounded-xl border border-border-subtle px-3 py-2.5 text-[12px] font-medium text-text-secondary hover:bg-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  resetPasswordMut.mutate({ userId: resetPasswordData.id })
                }
                disabled={resetPasswordMut.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-primary-700 transition-colors"
              >
                {resetPasswordMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                Generate New Password
              </button>
            </div>
          </div>
        </div>
      )}
      {resetPasswordResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Password Reset
                </h2>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  Share this password with the user
                </p>
              </div>
              <button
                onClick={() => setResetPasswordResult(null)}
                className="rounded-lg p-1.5 text-text-tertiary hover:bg-card transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-card p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Email
                </p>
                <code className="text-[12px] text-text-secondary font-mono">
                  {resetPasswordResult.email}
                </code>
              </div>
              <div className="rounded-xl bg-card p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  New Password
                </p>
                <div className="flex items-center justify-between">
                  <code className="text-[12px] text-text-secondary font-mono">
                    {resetPasswordResult.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        resetPasswordResult.password,
                      );
                      setCopiedPass(true);
                      setTimeout(() => setCopiedPass(false), 2000);
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-card/[0.04] transition-colors"
                  >
                    {copiedPass ? (
                      <CheckCheck className="h-3.5 w-3.5 text-finance-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setResetPasswordResult(null)}
              className="mt-4 w-full rounded-xl bg-primary-500 px-3 py-2.5 text-[12px] font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionChecklist({
  permissions,
  onChange,
}: {
  permissions: Permission[];
  onChange: (permissions: Permission[]) => void;
}) {
  const selected = new Set(permissions);
  const toggle = (permission: Permission) => {
    onChange(
      selected.has(permission)
        ? permissions.filter((item) => item !== permission)
        : [...permissions, permission],
    );
  };

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
          Allowed actions
        </legend>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() =>
              onChange(
                PERMISSION_GROUPS.flatMap((group) =>
                  group.permissions.map(([permission]) => permission),
                ),
              )
            }
            className="rounded-lg border border-border-subtle px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-card"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-lg border border-border-subtle px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-card"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.label}
            className="rounded-xl border border-border-subtle bg-card p-3"
          >
            <p className="mb-2 text-[10px] font-semibold text-text-primary">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.permissions.map(([permission, label]) => (
                <label
                  key={permission}
                  className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-[11px] text-text-secondary hover:bg-white/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(permission)}
                    onChange={() => toggle(permission)}
                    className="h-4 w-4 rounded border-border-subtle accent-primary-600"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function EditAccessModal({
  user,
  onClose,
}: {
  user: {
    id: string;
    name: string;
    role: RolePreset;
    permissions: unknown;
    status: keyof typeof statusConfig;
  };
  onClose: () => void;
}) {
  const [role, setRole] = useState<RolePreset>(user.role);
  const [permissions, setPermissions] = useState<Permission[]>(() =>
    resolvePermissions(user.role, user.permissions),
  );
  const [canAccess, setCanAccess] = useState(user.status === "ACTIVE");
  const utils = api.useUtils();
  const updateAccess = api.users.updateAccess.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      onClose();
    },
  });

  const selectPreset = (nextRole: RolePreset) => {
    setRole(nextRole);
    setPermissions(defaultPermissionsForRole(nextRole));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-app shadow-2xl">
        <div className="flex items-start justify-between border-b border-border-subtle p-5">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Edit access</h2>
            <p className="mt-1 text-[11px] text-text-tertiary">{user.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close access editor"
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <div>
            <label
              htmlFor="access-role-preset"
              className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wider text-text-tertiary"
            >
              Permission preset
            </label>
            <select
              id="access-role-preset"
              value={role}
              onChange={(event) =>
                selectPreset(event.target.value as RolePreset)
              }
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-card px-3 text-[12px] text-text-primary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {Object.entries(roleConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              Changing the preset resets the checklist. You can customize it
              afterward.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border-subtle bg-card p-3">
            <span>
              <span className="block text-[12px] font-semibold text-text-primary">
                Can access the system
              </span>
              <span className="mt-0.5 block text-[10px] text-text-tertiary">
                Turning this off blocks sign-in and revokes the current session.
              </span>
            </span>
            <input
              type="checkbox"
              checked={canAccess}
              onChange={(event) => setCanAccess(event.target.checked)}
              className="h-5 w-5 rounded border-border-subtle accent-primary-600"
            />
          </label>

          <PermissionChecklist
            permissions={permissions}
            onChange={setPermissions}
          />

          {updateAccess.error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-600"
            >
              {updateAccess.error.message}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border-subtle p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border-subtle px-3 py-2.5 text-[12px] font-medium text-text-secondary hover:bg-card"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              updateAccess.mutate({
                userId: user.id,
                role,
                permissions,
                canAccess,
              })
            }
            disabled={updateAccess.isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-3 py-2.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            {updateAccess.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Save access
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add User Modal (auto-generated credentials) ─────────

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<RolePreset>("MEMBER");
  const [permissions, setPermissions] = useState<Permission[]>(() =>
    defaultPermissionsForRole("MEMBER"),
  );
  const [canAccess, setCanAccess] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const utils = api.useUtils();

  const createUser = api.users.create.useMutation({
    onSuccess: (data) => {
      utils.users.list.invalidate();
      setSuccess({ email: data.email, password: data.generatedPassword });
    },
    onError: (err) => setValidationError(err.message),
  });

  // Auto-generated values
  const generatedEmail = useMemo(() => {
    if (!firstName.trim() || !lastName.trim()) return "";
    return `${slugify(firstName, lastName)}@arkodevph.com`;
  }, [firstName, lastName]);

  const [generatedPassword] = useState(generatePassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (!firstName.trim() || !lastName.trim()) {
      setValidationError("First and last name are required");
      return;
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    createUser.mutate({
      name: fullName,
      phone: phone.trim() || undefined,
      title: title || undefined,
      password: generatedPassword,
      role,
      permissions,
      canAccess,
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Success state ──────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                User Created
              </h2>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Share these credentials with the new user
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-card transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Sign-in URL */}
            <div className="rounded-xl bg-card p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Sign-in URL
              </p>
              <div className="flex items-center justify-between">
                <code className="text-[12px] text-text-secondary font-mono truncate">
                  {typeof window !== "undefined"
                    ? window.location.origin + "/auth/login"
                    : ""}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      typeof window !== "undefined"
                        ? window.location.origin + "/auth/login"
                        : "",
                      "url",
                    )
                  }
                  className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-card/[0.04] transition-colors"
                >
                  {copiedField === "url" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-finance-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="rounded-xl bg-card p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Email
              </p>
              <div className="flex items-center justify-between">
                <code className="text-[12px] text-text-secondary font-mono truncate">
                  {success.email}
                </code>
                <button
                  onClick={() => copyToClipboard(success.email, "email")}
                  className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-card/[0.04] transition-colors"
                >
                  {copiedField === "email" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-finance-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="rounded-xl bg-card p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                Temporary Password
              </p>
              <div className="flex items-center justify-between">
                <code className="text-[12px] text-text-secondary font-mono">
                  {success.password}
                </code>
                <button
                  onClick={() => copyToClipboard(success.password, "pass")}
                  className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-card/[0.04] transition-colors"
                >
                  {copiedField === "pass" ? (
                    <CheckCheck className="h-3.5 w-3.5 text-finance-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-primary-500 px-3 py-2.5 text-[12px] font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border-subtle bg-bg-app p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Add User</h2>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Credentials are auto-generated
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-card transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Full Name
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Contact
            </p>
            <div>
              <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
                Mobile number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Title / Position */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Position / Title
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Employee",
                "Admin",
                "CEO",
                "CTO",
                "CRO",
                "Accountant",
                "Designer",
                "Engineer",
                "Manager",
                "Supervisor",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(title === t ? "" : t)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                    title === t
                      ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
                      : "bg-card text-text-tertiary hover:bg-card"
                  }`}
                >
                  {t}
                </button>
              ))}
              {title &&
                ![
                  "Employee",
                  "Admin",
                  "CEO",
                  "CTO",
                  "CRO",
                  "Accountant",
                  "Designer",
                  "Engineer",
                  "Manager",
                  "Supervisor",
                ].includes(title) && (
                  <span className="rounded-lg bg-primary-50 px-2.5 py-1.5 text-[10px] font-medium text-primary-700 ring-1 ring-primary-200">
                    {title}
                  </span>
                )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Or type a custom title..."
              className="mt-1.5 block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Auto-generated credentials preview */}
          {(firstName.trim() || lastName.trim()) && (
            <div className="rounded-xl bg-card p-3 space-y-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
                Auto-generated credentials
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-tertiary">Email:</span>
                <code className="text-text-primary font-mono">
                  {generatedEmail}
                </code>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-tertiary">Password:</span>
                <code className="text-text-primary font-mono">
                  {generatedPassword}
                </code>
              </div>
              <p className="text-[9px] text-text-tertiary italic">
                Credentials will be shown after creation
              </p>
            </div>
          )}

          {/* Permission preset */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              Permission preset
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  "MEMBER",
                  "ADMIN",
                  "ACCOUNTANT",
                  "USER",
                  "CLIENT",
                  "INTERN",
                  "DEMO",
                ] as const
              ).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setPermissions(defaultPermissionsForRole(r));
                  }}
                  className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
                    role === r
                      ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
                      : "bg-card text-text-tertiary hover:bg-card"
                  }`}
                >
                  {r === "ADMIN"
                    ? "Admin"
                    : r === "ACCOUNTANT"
                      ? "Accountant"
                      : r === "MEMBER"
                        ? "Member"
                        : r === "CLIENT"
                          ? "Client"
                          : r === "DEMO"
                            ? "Demo"
                            : "User"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              Selecting a preset resets the checklist. Customize it below.
            </p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border-subtle bg-card p-3">
            <span>
              <span className="block text-[12px] font-semibold text-text-primary">
                Can access the system
              </span>
              <span className="mt-0.5 block text-[10px] text-text-tertiary">
                Turn off to create the account without allowing sign-in.
              </span>
            </span>
            <input
              type="checkbox"
              checked={canAccess}
              onChange={(event) => setCanAccess(event.target.checked)}
              className="h-5 w-5 rounded border-border-subtle accent-primary-600"
            />
          </label>

          <PermissionChecklist
            permissions={permissions}
            onChange={setPermissions}
          />

          {/* Error */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600">{validationError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border-subtle px-3 py-2.5 text-[12px] font-medium text-text-secondary hover:bg-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-3 py-2.5 text-[12px] font-semibold text-white shadow-sm disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {createUser.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ─────────────────────────────────

function EditProfileModal({
  userId,
  initialName,
  initialPhone,
  initialTitle,
  onClose,
}: {
  userId: string;
  initialName: string;
  initialPhone: string;
  initialTitle: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [title, setTitle] = useState(initialTitle ?? "");
  const utils = api.useUtils();

  const updateProfile = api.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      userId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      title: title || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text-primary">Edit Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-tertiary hover:bg-card transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="No phone set"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-tertiary mb-1 block">
              Title / Position
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {[
                "Employee",
                "Admin",
                "CEO",
                "CTO",
                "CRO",
                "Accountant",
                "Designer",
                "Engineer",
                "Manager",
                "Supervisor",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(title === t ? "" : t)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                    title === t
                      ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
                      : "bg-card text-text-tertiary hover:bg-card"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-xl border border-border-subtle bg-card px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Custom title..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border-subtle px-3 py-2.5 text-[12px] font-medium text-text-secondary hover:bg-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 px-3 py-2.5 text-[12px] font-semibold text-white shadow-sm disabled:opacity-50 active:scale-[0.97] transition-all"
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
