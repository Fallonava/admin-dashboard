import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const dataset = [
    {
      category: "Edukasi Poli",
      title: "Poli Konservasi Gigi",
      content: "Poli Konservasi Gigi fokus pada mempertahankan gigi asli selama mungkin melalui perawatan saraf gigi (PSA), penambalan estetik, dan restorasi gigi yang rusak. Cocok bagi pasien dengan keluhan gigi berlubang dalam atau nyeri berdenyut.",
      tags: ["gigi", "tambal", "saraf gigi", "psa"]
    },
    {
      category: "Edukasi Poli",
      title: "Poli Gigi Bedah Mulut",
      content: "Menangani kasus bedah di area mulut seperti pencabutan gigi bungsu yang miring (impaksi/odontektomi), operasi rahang, kista mulut, dan tumor jinak di area gusi.",
      tags: ["gigi", "operasi", "impaksi", "bedah mulut"]
    },
    {
      category: "Edukasi Poli",
      title: "Poli Urologi",
      content: "Menangani gangguan saluran kemih pria dan wanita serta organ reproduksi pria. Keluhan umum: kencing batu, prostat, batu ginjal, infeksi saluran kemih, dan kencing sakit.",
      tags: ["urologi", "ginjal", "prostat", "kencing"]
    },
    {
      category: "Edukasi Poli",
      title: "Poli Saraf (Neurologi)",
      content: "Menangani gangguan otak, sumsum tulang belakang, dan saraf tepi. Keluhan umum: stroke, migrain, vertigo mendadak, saraf terjepit (HNP), dan epilepsi.",
      tags: ["saraf", "stroke", "vertigo", "pusing"]
    },
    {
      category: "Edukasi Poli",
      title: "Poli Orthopaedi",
      content: "Fokus pada sistem otot dan tulang. Menangani patah tulang, cedera ligamen (ACL), nyeri sendi lutut, kifosis, dan kelainan bentuk tulang belakang.",
      tags: ["tulang", "patah", "sendi", "orthopaedi"]
    },
    {
      category: "Edukasi Poli",
      title: "Poli Jantung (Kardiologi)",
      content: "Melayani pemeriksaan jantung koroner, irama jantung (aritmia), dan gagal jantung. Segera periksa jika merasakan nyeri dada seperti tertindih beban berat.",
      tags: ["jantung", "nyeri dada", "kardio"]
    },
    {
       category: "Edukasi Poli",
       title: "Poli Penyakit Dalam",
       content: "Menangani berbagai gangguan organ dalam dewasa seperti hipertensi (darah tinggi), diabetes (kencing manis), asam lambung (GERD), dan penyakit ginjal.",
       tags: ["dalam", "internis", "diabetes", "lambung"]
    }
  ];

  console.log("Memulai injeksi KnowledgeBase...");

  for (const data of dataset) {
    await prisma.knowledgeBase.upsert({
      where: { id: `kb-${data.title.toLowerCase().replace(/\s+/g, '-')}` },
      update: data,
      create: {
        id: `kb-${data.title.toLowerCase().replace(/\s+/g, '-')}`,
        ...data
      }
    });
  }

  console.log("Injeksi selesai! AI kini memiliki data pustaka medis dasar.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
