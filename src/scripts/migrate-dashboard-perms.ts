import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai migrasi izin dashboard...");

  // 1. Cari semua RolePermission yang menggunakan resource 'dashboard'
  const dashboardPerms = await prisma.rolePermission.findMany({
    where: { resource: "dashboard" },
  });

  if (dashboardPerms.length === 0) {
    console.log("✅ Tidak ditemukan data izin 'dashboard' lama. Lewati.");
    return;
  }

  console.log(`📦 Ditemukan ${dashboardPerms.length} izin lama. Memproses...`);

  for (const perm of dashboardPerms) {
    try {
      // Hapus yang lama (opsional, tapi lebih baik karena ada @@unique)
      await prisma.rolePermission.delete({ where: { id: perm.id } });

      // Buat dua izin baru: denah_live dan kontrol_status
      // Sebaiknya pakai createMany atau individual agar tidak nabrak unique
      await prisma.rolePermission.upsert({
        where: { roleId_resource_action: { roleId: perm.roleId, resource: "denah_live", action: perm.action } },
        update: {},
        create: { roleId: perm.roleId, resource: "denah_live", action: perm.action }
      });

      await prisma.rolePermission.upsert({
        where: { roleId_resource_action: { roleId: perm.roleId, resource: "kontrol_status", action: perm.action } },
        update: {},
        create: { roleId: perm.roleId, resource: "kontrol_status", action: perm.action }
      });

      console.log(`✅ Migrasi Role ID ${perm.roleId} selesai.`);
    } catch (e) {
      console.error(`❌ Gagal memigrasi perm ID ${perm.id}:`, e);
    }
  }

  console.log("🏁 Migrasi selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
