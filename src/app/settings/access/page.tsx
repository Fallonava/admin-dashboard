"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { RESOURCES } from "@/lib/auth-shared";
import {
  Shield, Users, Plus, Trash2, Save, Edit2, X, Check,
  UserPlus, Key, Eye, Pencil, AlertCircle, Loader2,
  Fingerprint, Lock, Unlock, Activity, Clock, Star,
  LayoutDashboard, Zap, Calendar, CalendarDays, Palmtree,
  FileSpreadsheet, Bot, Tv, UserSquare2, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const RESOURCE_ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Zap, Calendar, CalendarDays,
  Users, Palmtree, FileSpreadsheet, Bot, Tv,
  UserSquare2: Users, Shield, Settings,
};
function getResourceIcon(iconName: string): React.ElementType {
  return RESOURCE_ICON_MAP[iconName] || Shield;
}

interface Permission { resource: string; action: string; }
interface Role {
  id: string; name: string; description: string | null; isSystem: boolean;
  permissions: (Permission & { id: string })[];
  _count: { users: number };
}
interface User {
  id: string; username: string; name: string; isActive: boolean;
  roleId: string | null; role: { id: string; name: string } | null;
  createdAt: string;
  lastLogin?: string | null;
}

function getRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Belum pernah";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function isRecentlyActive(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000;
}

export default function AccessManagementPage() {
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [rolePerms, setRolePerms] = useState<Record<string, { read: boolean; write: boolean }>>({});
  const [showNewRole, setShowNewRole] = useState(false);

  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", roleId: "" });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<{ name: string; roleId: string; password: string }>({ name: "", roleId: "", password: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([fetch("/api/roles"), fetch("/api/users")]);
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch { setError("Gagal memuat data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (msg: string, type: "success" | "error") => {
    if (type === "success") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  const initRolePerms = (role?: Role) => {
    const perms: Record<string, { read: boolean; write: boolean }> = {};
    RESOURCES.forEach((r) => { perms[r.key] = { read: false, write: false }; });
    if (role) {
      role.permissions.forEach((p) => {
        if (perms[p.resource]) {
          if (p.action === "read") perms[p.resource].read = true;
          if (p.action === "write") perms[p.resource].write = true;
        }
      });
    }
    setRolePerms(perms);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role); setNewRoleName(role.name);
    setNewRoleDesc(role.description || ""); initRolePerms(role); setShowNewRole(false);
  };
  const openNewRole = () => {
    setEditingRole(null); setNewRoleName(""); setNewRoleDesc(""); initRolePerms(); setShowNewRole(true);
  };

  const buildPermissions = (): Permission[] => {
    const perms: Permission[] = [];
    Object.entries(rolePerms).forEach(([resource, val]) => {
      if (val.read) perms.push({ resource, action: "read" });
      if (val.write) perms.push({ resource, action: "write" });
    });
    return perms;
  };

  const saveRole = async () => {
    setSaving(true);
    try {
      const permissions = buildPermissions();
      const body = editingRole
        ? { id: editingRole.id, name: newRoleName, description: newRoleDesc, permissions }
        : { name: newRoleName, description: newRoleDesc, permissions };
      const res = await fetch("/api/roles", {
        method: editingRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showMessage(editingRole ? "Role berhasil diperbarui" : "Role berhasil dibuat", "success");
        setEditingRole(null); setShowNewRole(false); fetchData();
      } else {
        const data = await res.json();
        showMessage(data.error || "Gagal menyimpan role", "error");
      }
    } catch { showMessage("Gagal menyimpan role", "error"); }
    finally { setSaving(false); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Yakin ingin menghapus role ini?")) return;
    const res = await fetch("/api/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { showMessage("Role berhasil dihapus", "success"); fetchData(); }
    else { const d = await res.json(); showMessage(d.error || "Gagal menghapus role", "error"); }
  };

  const saveNewUser = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) });
      if (res.ok) {
        showMessage("Pengguna berhasil dibuat", "success");
        setShowNewUser(false); setNewUser({ username: "", password: "", name: "", roleId: "" }); fetchData();
      } else { const d = await res.json(); showMessage(d.error || "Gagal membuat pengguna", "error"); }
    } catch { showMessage("Gagal membuat pengguna", "error"); }
    finally { setSaving(false); }
  };

  const updateUser = async (id: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { id, name: editUserData.name, roleId: editUserData.roleId || null };
      if (editUserData.password) body.password = editUserData.password;
      const res = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { showMessage("Pengguna berhasil diperbarui", "success"); setEditingUser(null); fetchData(); }
      else { const d = await res.json(); showMessage(d.error || "Gagal memperbarui", "error"); }
    } catch { showMessage("Gagal memperbarui", "error"); }
    finally { setSaving(false); }
  };

  const toggleUserActive = async (user: User) => {
    const res = await fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, isActive: !user.isActive }) });
    if (res.ok) { fetchData(); } else { showMessage("Gagal mengubah status", "error"); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return;
    const res = await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { showMessage("Pengguna berhasil dihapus", "success"); fetchData(); }
    else { showMessage("Gagal menghapus pengguna", "error"); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 p-6">
        <div className="p-6 clay-surface rounded-[32px] shadow-xl">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Akses Ditolak</h2>
          <p className="text-xs text-zinc-500 font-bold mt-1">Hanya Super Admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full min-h-0 overflow-hidden relative text-zinc-900 dark:text-zinc-100">
      <div className="relative z-10 flex-none">
        <PageHeader
          icon={<Shield size={20} className="text-white" strokeWidth={2.5} />}
          title="Manajemen Akses"
          accentWord="Akses"
          accentColor="text-blue-600 dark:text-blue-400"
          subtitle="Kelola role, izin akses, dan pengguna sistem"
          iconClay="clay-icon-blue"
          accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 clay-pill-blue text-white rounded-full text-[10px] font-black shrink-0 shadow-sm">
              <Fingerprint size={10} />
              {roles.length} Role • {users.length} Akun
            </span>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8 space-y-5 relative z-10 pt-4">

        {/* Feedback Toast */}
        {(error || success) && (
          <div className={cn(
            "p-4 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-md animate-in slide-in-from-top-2 duration-300 text-white",
            error ? "clay-pill-rose" : "clay-pill-emerald"
          )}>
            {error ? <AlertCircle size={16} /> : <Check size={16} />}
            {error || success}
          </div>
        )}

        {/* Segmented Tabs */}
        <div className="flex clay-inset p-1 rounded-2xl w-fit">
          {[
            { id: "roles", label: "Roles & Izin", Icon: Shield },
            { id: "users", label: "Pengguna Sistem", Icon: Users },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "roles" | "users")}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                tab === id
                  ? "clay-pill-blue text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="p-4 clay-button rounded-full">
              <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <p className="text-xs font-black text-zinc-400">Memuat data keamanan...</p>
          </div>
        ) : tab === "roles" ? (
          /* ═══════════════ ROLES TAB ═══════════════ */
          <div className="space-y-5">
            <button
              onClick={openNewRole}
              className="flex items-center gap-2 px-5 py-2.5 clay-pill-blue text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md"
            >
              <Plus size={16} /> Buat Role Baru
            </button>

            {/* Role Badge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roles.map((role) => {
                const writePerms = role.permissions.filter(p => p.action === "write").length;
                const readPerms = role.permissions.filter(p => p.action === "read").length;
                return (
                  <div
                    key={role.id}
                    className={cn(
                      "group relative overflow-hidden rounded-[28px] clay-surface p-5 hover:shadow-2xl transition-all duration-300",
                      role.isSystem ? "ring-2 ring-amber-400/40" : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0",
                          role.isSystem ? "clay-pill-amber" : "clay-pill-blue"
                        )}>
                          {role.isSystem ? <Star size={18} fill="currentColor" strokeWidth={0} /> : role.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-sm">{role.name}</h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">{role._count.users} pengguna aktif</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditRole(role)} className="p-2 text-zinc-500 hover:text-blue-600 clay-button rounded-xl transition-all">
                          <Edit2 size={14} />
                        </button>
                        {!role.isSystem && (
                          <button onClick={() => deleteRole(role.id)} className="p-2 text-zinc-500 hover:text-rose-600 clay-button rounded-xl transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mb-4 min-h-[2rem] leading-relaxed">{role.description || "Tidak ada deskripsi"}</p>

                    {/* Permission Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {role.isSystem ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black clay-pill-amber text-white shadow-sm">
                          <Key size={10} /> Akses Penuh
                        </span>
                      ) : (
                        <>
                          {writePerms > 0 && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black clay-pill-emerald text-white shadow-sm">
                              <Pencil size={10} /> {writePerms} Edit
                            </span>
                          )}
                          {readPerms > 0 && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black clay-pill-blue text-white shadow-sm">
                              <Eye size={10} /> {readPerms} Lihat
                            </span>
                          )}
                          {writePerms === 0 && readPerms === 0 && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black clay-button text-zinc-500">
                              <Lock size={10} /> Tanpa Akses
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Role Editor Modal */}
            {(editingRole || showNewRole) && (
              <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => { setEditingRole(null); setShowNewRole(false); }}
              >
                <div
                  className="clay-surface rounded-[36px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 clay-pill-blue text-white rounded-2xl">
                        <Shield size={20} />
                      </div>
                      <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                        {editingRole ? `Edit: ${editingRole.name}` : "Buat Role Baru"}
                      </h2>
                    </div>
                    <button onClick={() => { setEditingRole(null); setShowNewRole(false); }} className="p-2 clay-button text-zinc-500 rounded-full active:scale-95">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Nama Role</label>
                      <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className="w-full mt-1.5 px-4 py-2.5 clay-inset rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                        placeholder="Contoh: Resepsionis"
                        disabled={editingRole?.isSystem}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Deskripsi</label>
                      <input
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        className="w-full mt-1.5 px-4 py-2.5 clay-inset rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                        placeholder="Deskripsi singkat tugas..."
                      />
                    </div>
                  </div>

                  {/* Permission Control Tiles */}
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Matriks Izin Akses</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {RESOURCES.map((r) => {
                      const canRead = rolePerms[r.key]?.read || false;
                      const canWrite = rolePerms[r.key]?.write || false;
                      const RIcon = getResourceIcon(r.icon) as React.FC<{ size?: number; strokeWidth?: number }>;
                      return (
                        <div key={r.key} className="flex items-center justify-between p-3.5 rounded-2xl clay-button">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              canWrite ? "clay-pill-emerald text-white" :
                              canRead ? "clay-pill-blue text-white" :
                              "clay-inset text-zinc-400"
                            )}>
                              <RIcon size={14} strokeWidth={2.5} />
                            </div>
                            <span className={cn("text-xs font-black truncate", canWrite ? "text-emerald-600 dark:text-emerald-400" : canRead ? "text-blue-600 dark:text-blue-400" : "text-zinc-500")}>
                              {r.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Read Toggle */}
                            <button
                              type="button"
                              onClick={() => setRolePerms(p => ({ ...p, [r.key]: { ...p[r.key], read: !canRead, write: canRead ? false : p[r.key]?.write } }))}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95",
                                canRead ? "clay-pill-blue text-white shadow-sm" : "clay-button text-zinc-500"
                              )}
                            >
                              <Eye size={12} /> Lihat
                            </button>
                            {/* Write Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const newWrite = !canWrite;
                                setRolePerms(p => ({ ...p, [r.key]: { read: newWrite ? true : p[r.key]?.read, write: newWrite } }));
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95",
                                canWrite ? "clay-pill-emerald text-white shadow-sm" : "clay-button text-zinc-500"
                              )}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2.5 mt-6 pt-5 border-t border-zinc-200/60 dark:border-white/5">
                    <button
                      onClick={() => { setEditingRole(null); setShowNewRole(false); }}
                      className="px-4 py-2 text-xs font-black clay-button text-zinc-600 dark:text-zinc-300 rounded-xl transition-all active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveRole}
                      disabled={saving || !newRoleName}
                      className="px-5 py-2 text-xs font-black text-white clay-pill-blue rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md active:scale-95"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      Simpan Role
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════ USERS TAB ═══════════════ */
          <div className="space-y-5">
            <button
              onClick={() => setShowNewUser(true)}
              className="flex items-center gap-2 px-5 py-2.5 clay-pill-blue text-white rounded-2xl text-xs font-black transition-all active:scale-95 shadow-md"
            >
              <UserPlus size={16} /> Tambah Pengguna
            </button>

            {/* New User Form */}
            {showNewUser && (
              <div className="clay-surface rounded-[28px] p-5 sm:p-6 space-y-4 shadow-xl">
                <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                  <UserPlus size={16} className="text-blue-500" /> Akun Baru
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "name", placeholder: "Nama lengkap", type: "text" },
                    { key: "username", placeholder: "Username", type: "text" },
                    { key: "password", placeholder: "Password", type: "password" },
                  ].map(({ key, placeholder, type }) => (
                    <input
                      key={key}
                      type={type}
                      value={(newUser as any)[key]}
                      onChange={(e) => setNewUser(u => ({ ...u, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="px-4 py-2.5 clay-inset rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                    />
                  ))}
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser(u => ({ ...u, roleId: e.target.value }))}
                    className="px-4 py-2.5 clay-inset rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
                  >
                    <option value="" className="bg-white dark:bg-zinc-900">Pilih Role...</option>
                    {roles.map((r) => <option key={r.id} value={r.id} className="bg-white dark:bg-zinc-900">{r.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowNewUser(false)} className="px-4 py-2 text-xs font-black clay-button text-zinc-600 dark:text-zinc-300 rounded-xl transition-all active:scale-95">Batal</button>
                  <button
                    onClick={saveNewUser}
                    disabled={saving || !newUser.username || !newUser.password || !newUser.name}
                    className="px-5 py-2 text-xs font-black text-white clay-pill-blue rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Buat Akun
                  </button>
                </div>
              </div>
            )}

            {/* User Cards */}
            <div className="space-y-3">
              {users.map((u) => {
                const isActive = isRecentlyActive(u.lastLogin);
                const relTime = getRelativeTime(u.lastLogin);
                return (
                  <div
                    key={u.id}
                    className="group clay-surface rounded-[24px] p-4 sm:p-5 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm clay-pill-blue shadow-md">
                            {u.name.charAt(0)}
                          </div>
                          {/* Activity Pulse Dot */}
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900",
                            u.isActive
                              ? (isActive ? "bg-emerald-500" : "bg-zinc-400")
                              : "bg-rose-500"
                          )}>
                            {u.isActive && isActive && (
                              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0">
                          {editingUser === u.id ? (
                            <input
                              value={editUserData.name}
                              onChange={(e) => setEditUserData(d => ({ ...d, name: e.target.value }))}
                              className="px-3 py-1.5 clay-inset rounded-xl text-xs font-bold w-full outline-none text-zinc-800 dark:text-zinc-200"
                            />
                          ) : (
                            <p className="font-black text-zinc-900 dark:text-zinc-100 text-sm truncate">{u.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-zinc-400 font-mono font-bold">{u.username}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-bold">
                              <Clock size={10} /> {relTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Role Selector / Badge */}
                      <div className="shrink-0">
                        {editingUser === u.id ? (
                          <select
                            value={editUserData.roleId}
                            onChange={(e) => setEditUserData(d => ({ ...d, roleId: e.target.value }))}
                            className="px-3 py-2 clay-inset rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none"
                          >
                            <option value="">Tanpa Role</option>
                            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        ) : (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black shadow-sm",
                            u.role ? "clay-pill-blue text-white" : "clay-button text-zinc-500"
                          )}>
                            {u.role?.name || "Tanpa Role"}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Active toggle */}
                        <button
                          onClick={() => toggleUserActive(u)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all active:scale-95 shadow-sm",
                            u.isActive
                              ? "clay-pill-emerald text-white"
                              : "clay-pill-rose text-white"
                          )}
                        >
                          {u.isActive ? <Unlock size={11} /> : <Lock size={11} />}
                          {u.isActive ? "Aktif" : "Nonaktif"}
                        </button>

                        {editingUser === u.id ? (
                          <>
                            <input
                              type="password"
                              value={editUserData.password}
                              onChange={(e) => setEditUserData(d => ({ ...d, password: e.target.value }))}
                              placeholder="Password baru"
                              className="px-3 py-1.5 clay-inset rounded-xl text-xs w-32 outline-none font-bold text-zinc-800 dark:text-zinc-200"
                            />
                            <button onClick={() => updateUser(u.id)} className="p-2 clay-pill-emerald text-white rounded-xl active:scale-95 transition-all">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingUser(null)} className="p-2 clay-button text-zinc-500 rounded-xl active:scale-95 transition-all">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingUser(u.id); setEditUserData({ name: u.name, roleId: u.roleId || "", password: "" }); }}
                              className="p-2 text-zinc-500 hover:text-blue-600 clay-button rounded-xl transition-all active:scale-95"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="p-2 text-zinc-500 hover:text-rose-600 clay-button rounded-xl transition-all active:scale-95">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
