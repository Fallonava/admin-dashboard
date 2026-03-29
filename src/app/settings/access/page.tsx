"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { RESOURCES } from "@/lib/auth-shared";
import {
  Shield, Users, Plus, Trash2, Save, Edit2, X, Check,
  UserPlus, Key, Eye, Pencil, AlertCircle, Loader2,
  Fingerprint, Lock, Unlock, Activity, Clock, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

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

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  return Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000; // < 1 jam
}

const ROLE_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
];

function getRoleGradient(name: string, isSystem: boolean): string {
  if (isSystem) return "from-amber-400 to-orange-500";
  const idx = name.charCodeAt(0) % ROLE_GRADIENTS.length;
  return ROLE_GRADIENTS[idx];
}

// ── Component ─────────────────────────────────────────────────────────────────
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

  // Live clock for relative times
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Role Editor State ──
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [rolePerms, setRolePerms] = useState<Record<string, { read: boolean; write: boolean }>>({});
  const [showNewRole, setShowNewRole] = useState(false);

  // ── User Editor State ──
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

  // ── Role Helpers ──
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

  // ── User Helpers ──
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[32px]">
          <Shield className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500">Hanya Super Admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col h-[calc(100vh-1rem)] overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-blue-300/20 rounded-full blur-[80px] opacity-70 animate-blob" />
        <div className="absolute top-[30%] right-[-10%] w-[30%] h-[40%] bg-violet-300/20 rounded-full blur-[80px] opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-5%] left-[25%] w-[40%] h-[30%] bg-indigo-300/15 rounded-full blur-[80px] opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex-none">
        <PageHeader
          icon={<Shield size={20} className="text-white" />}
          title="Manajemen "
          accentWord="Akses"
          accentColor="text-blue-600"
          subtitle="Kelola role, izin akses, dan pengguna sistem"
          iconGradient="from-blue-500 to-indigo-600"
          accentBarGradient="from-blue-500 via-indigo-500 to-violet-500"
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shrink-0">
              <Fingerprint size={10} />
              {roles.length} Role • {users.length} Akun
            </span>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-8 space-y-5 relative z-10 pt-5">

        {/* Feedback Toast */}
        {(error || success) && (
          <div className={cn(
            "p-4 rounded-[20px] text-sm font-bold flex items-center gap-2.5 border transition-all animate-in slide-in-from-top-2 duration-300",
            error ? "bg-rose-50 text-rose-700 border-rose-200 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.15)]"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]"
          )}>
            {error ? <AlertCircle size={16} /> : <Check size={16} />}
            {error || success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/60 backdrop-blur-xl p-1.5 rounded-[20px] w-fit border border-white/80 shadow-sm">
          {[
            { id: "roles", label: "Roles & Izin", Icon: Shield },
            { id: "users", label: "Pengguna Sistem", Icon: Users },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "roles" | "users")}
              className={cn(
                "px-5 py-2.5 rounded-[15px] text-sm font-black transition-all flex items-center gap-2",
                tab === id
                  ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="p-4 bg-blue-50 rounded-full">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
            <p className="text-sm font-bold text-slate-400">Memuat data keamanan...</p>
          </div>
        ) : tab === "roles" ? (
          /* ═══════════════ ROLES TAB ═══════════════ */
          <div className="space-y-5">
            <button
              onClick={openNewRole}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-[0_8px_24px_-6px_rgba(99,102,241,0.5)] active:scale-95"
            >
              <Plus size={18} /> Buat Role Baru
            </button>

            {/* Role Badge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {roles.map((role) => {
                const grad = getRoleGradient(role.name, role.isSystem);
                const writePerms = role.permissions.filter(p => p.action === "write").length;
                const readPerms = role.permissions.filter(p => p.action === "read").length;
                return (
                  <div
                    key={role.id}
                    className={cn(
                      "group relative overflow-hidden rounded-[28px] border bg-white/60 backdrop-blur-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
                      role.isSystem
                        ? "border-amber-200/80 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.2)]"
                        : "border-white/80 shadow-sm hover:border-indigo-200/60 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.15)]"
                    )}
                  >
                    {/* Top gradient accent */}
                    <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", grad)} />

                    <div className="flex items-start justify-between mb-4 mt-1">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-11 h-11 rounded-[16px] flex items-center justify-center text-white font-black text-base shadow-md bg-gradient-to-br flex-shrink-0", grad)}>
                          {role.isSystem ? <Star size={18} fill="currentColor" strokeWidth={0} /> : role.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800">{role.name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{role._count.users} pengguna aktif</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditRole(role)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit2 size={15} />
                        </button>
                        {!role.isSystem && (
                          <button onClick={() => deleteRole(role.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[12px] text-slate-500 font-medium mb-4 min-h-[2rem]">{role.description || "Tidak ada deskripsi"}</p>

                    {/* Permission Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {role.isSystem ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Key size={10} /> Akses Penuh
                        </span>
                      ) : (
                        <>
                          {writePerms > 0 && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Pencil size={10} /> {writePerms} Edit
                            </span>
                          )}
                          {readPerms > 0 && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                              <Eye size={10} /> {readPerms} Lihat
                            </span>
                          )}
                          {writePerms === 0 && readPerms === 0 && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-slate-50 text-slate-500 border border-slate-200">
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
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => { setEditingRole(null); setShowNewRole(false); }}
              >
                <div
                  className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-white/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-[14px]">
                        <Shield size={20} className="text-blue-600" />
                      </div>
                      <h2 className="text-lg font-black text-slate-800">
                        {editingRole ? `Edit: ${editingRole.name}` : "Buat Role Baru"}
                      </h2>
                    </div>
                    <button onClick={() => { setEditingRole(null); setShowNewRole(false); }} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nama Role</label>
                      <input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-[16px] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 bg-slate-50/50 transition-all"
                        placeholder="Contoh: Resepsionis"
                        disabled={editingRole?.isSystem}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Deskripsi</label>
                      <input
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-[16px] text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 bg-slate-50/50 transition-all"
                        placeholder="Deskripsi singkat tugas..."
                      />
                    </div>
                  </div>

                  {/* Permission Control Tiles */}
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Matriks Izin Akses</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {RESOURCES.map((r) => {
                      const canRead = rolePerms[r.key]?.read || false;
                      const canWrite = rolePerms[r.key]?.write || false;
                      return (
                        <div key={r.key} className={cn(
                          "flex items-center justify-between p-3.5 rounded-[16px] border transition-all",
                          canWrite ? "bg-emerald-50/70 border-emerald-200/80" :
                          canRead ? "bg-sky-50/70 border-sky-200/80" :
                          "bg-slate-50/50 border-slate-200/50 hover:border-slate-300"
                        )}>
                          <span className={cn("text-sm font-bold", canWrite ? "text-emerald-800" : canRead ? "text-sky-800" : "text-slate-500")}>
                            {r.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* Read Toggle */}
                            <button
                              type="button"
                              onClick={() => setRolePerms(p => ({ ...p, [r.key]: { ...p[r.key], read: !canRead, write: canRead ? false : p[r.key]?.write } }))}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-black border transition-all",
                                canRead ? "bg-sky-600 text-white border-sky-700 shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-sky-300 hover:text-sky-600"
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
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-black border transition-all",
                                canWrite ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                              )}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                    <button
                      onClick={() => { setEditingRole(null); setShowNewRole(false); }}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-[14px] transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={saveRole}
                      disabled={saving || !newRoleName}
                      className="px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-[14px] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.4)]"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-[0_8px_24px_-6px_rgba(99,102,241,0.5)] active:scale-95"
            >
              <UserPlus size={18} /> Tambah Pengguna
            </button>

            {/* New User Form */}
            {showNewUser && (
              <div className="bg-white/70 backdrop-blur-xl border border-blue-200/60 rounded-[28px] p-5 sm:p-6 space-y-4 shadow-sm">
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <UserPlus size={16} className="text-blue-600" /> Akun Baru
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
                      className="px-4 py-3 border border-slate-200 rounded-[16px] text-sm font-semibold bg-white/70 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                    />
                  ))}
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser(u => ({ ...u, roleId: e.target.value }))}
                    className="px-4 py-3 border border-slate-200 rounded-[16px] text-sm font-semibold bg-white/70 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  >
                    <option value="">Pilih Role...</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowNewUser(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-[14px] transition-all">Batal</button>
                  <button
                    onClick={saveNewUser}
                    disabled={saving || !newUser.username || !newUser.password || !newUser.name}
                    className="px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[14px] disabled:opacity-50 flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(99,102,241,0.3)] transition-all"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Buat Akun
                  </button>
                </div>
              </div>
            )}

            {/* User Cards */}
            <div className="space-y-3">
              {users.map((u) => {
                const gradUser = getRoleGradient(u.role?.name || "Z", false);
                const isActive = isRecentlyActive(u.lastLogin);
                const relTime = getRelativeTime(u.lastLogin);
                return (
                  <div
                    key={u.id}
                    className="group bg-white/60 backdrop-blur-xl border border-white/80 rounded-[24px] p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:border-slate-200/80"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "w-11 h-11 rounded-[16px] flex items-center justify-center text-white font-black text-sm bg-gradient-to-br shadow-md",
                            gradUser
                          )}>
                            {u.name.charAt(0)}
                          </div>
                          {/* Activity Pulse Dot */}
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                            u.isActive
                              ? (isActive ? "bg-emerald-500" : "bg-slate-300")
                              : "bg-rose-400"
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
                              className="px-3 py-1.5 border rounded-[12px] text-sm font-bold w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : (
                            <p className="font-black text-slate-800 truncate">{u.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-mono">{u.username}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Clock size={9} /> {relTime}
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
                            className="px-3 py-2 border border-slate-200 rounded-[12px] text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="">Tanpa Role</option>
                            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        ) : (
                          <span className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-black border",
                            u.role ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-200"
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
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border transition-all",
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
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
                              className="px-3 py-1.5 border rounded-[12px] text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button onClick={() => updateUser(u.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingUser(u.id); setEditUserData({ name: u.name, roleId: u.roleId || "", password: "" }); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={15} />
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
