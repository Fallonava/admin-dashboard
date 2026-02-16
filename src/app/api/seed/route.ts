import { NextResponse } from 'next/server';
import { doctorStore, shiftStore, Doctor, Shift } from '@/lib/data-service';

export async function GET() {
    // 1. Clear existing data (optional, but good for clean slate)
    // helper to clear would be nice, but we can just overwrite ids or ignore.
    // actually JSONStore append/update based on ID. 
    // We will just generate a fresh list.

    const newDoctors: Doctor[] = [
        // Orthopaedi
        { id: 101, name: "dr. Muhammad Luthfi, Sp. OT", specialty: "Orthopaedi", status: "Idle", category: "Bedah" },
        { id: 102, name: "dr. Nanda Notario, Sp. OT", specialty: "Orthopaedi", status: "Idle", category: "Bedah" },
        // Bedah Umum
        { id: 103, name: "dr. Endro RI Wibowo, Sp. B", specialty: "Bedah Umum", status: "Idle", category: "Bedah" },
        // Urologi
        { id: 104, name: "dr. Eko Subekti, Sp. U", specialty: "Urologi", status: "Idle", category: "Bedah" },
        // Kandungan
        { id: 105, name: "dr. Gatot Hananta, Sp. OG", specialty: "Kandungan", status: "Idle", category: "NonBedah" },
        { id: 106, name: "dr. Hepta Lidia, Sp. OG", specialty: "Kandungan", status: "Idle", category: "NonBedah" },
        { id: 107, name: "dr. Pritasari Dewi D, Sp. OG", specialty: "Kandungan", status: "Idle", category: "NonBedah" },
        { id: 108, name: "dr. Ardian Rahmansyah, Sp. OG", specialty: "Kandungan", status: "Idle", category: "NonBedah" },
        // Anak
        { id: 109, name: "dr. RR Irma Rossyana, Sp. A", specialty: "Anak", status: "Idle", category: "NonBedah" },
        { id: 110, name: "dr. Annisa Noor A, Sp. A", specialty: "Anak", status: "Idle", category: "NonBedah" },
        // Jiwa
        { id: 111, name: "dr. Taufik Hidayanto, Sp. KJ", specialty: "Kedokteran Jiwa", status: "Idle", category: "NonBedah" },
        { id: 112, name: "dr. Nova Kurniasari, Sp. KJ", specialty: "Kedokteran Jiwa", status: "Idle", category: "NonBedah" },
        // Saraf
        { id: 113, name: "dr. Ajeng Putri, Sp. N", specialty: "Saraf", status: "Idle", category: "NonBedah" },
        { id: 114, name: "dr. Setyo Dirahayu, Sp. N", specialty: "Saraf", status: "Idle", category: "NonBedah" },
        { id: 115, name: "dr. Ahmad Tanji, Sp. N", specialty: "Saraf", status: "Idle", category: "NonBedah" },
        // Psikologi
        { id: 116, name: "Siti K Sa'diyah, M. Psi. Psikologi", specialty: "Psikologi", status: "Idle", category: "NonBedah" },
        // Mata
        { id: 117, name: "dr. Wahid Heru Widodo, Sp. M", specialty: "Mata", status: "Idle", category: "NonBedah" },
        // THT KL
        { id: 118, name: "dr. Lirans Tia K, Sp. THT KL", specialty: "THT KL", status: "Idle", category: "NonBedah" },
        { id: 119, name: "dr. Wahyu Dwi K, Sp. THT KL", specialty: "THT KL", status: "Idle", category: "NonBedah" },
        // Gigi
        { id: 120, name: "drg. Rafika Yusniar", specialty: "Gigi Umum", status: "Idle", category: "NonBedah" },
        { id: 121, name: "drg. Yulinda Primilisa", specialty: "Gigi Umum", status: "Idle", category: "NonBedah" },
        { id: 122, name: "drg. Dyah Tri Kusuma, Sp. KG", specialty: "Gigi Konservasi", status: "Idle", category: "NonBedah" },
        { id: 123, name: "drg. Robby Ramadhonie, Sp. BMM", specialty: "Bedah Mulut", status: "Idle", category: "Bedah" },
        // Rehab
        { id: 124, name: "dr. Wati, SP. KFR", specialty: "Rehab Medik", status: "Idle", category: "NonBedah" },
        // Fisioterapi
        { id: 125, name: "Bingsar Galih, Amd. Ftr", specialty: "Fisioterapi", status: "Idle", category: "NonBedah" },
        { id: 126, name: "Panca Nugraha, Amd. Ftr", specialty: "Fisioterapi", status: "Idle", category: "NonBedah" },
        // VCT
        { id: 127, name: "dr. Oktavia Adiyani", specialty: "VCT", status: "Idle", category: "NonBedah" },
        // Umum
        { id: 128, name: "dr. Almer Belami", specialty: "Umum", status: "Idle", category: "NonBedah" },
        // Penyakit Dalam
        { id: 129, name: "dr. Leo Chandra WPW, Sp. PD, M. KES", specialty: "Penyakit Dalam", status: "Idle", category: "NonBedah" },
        { id: 130, name: "dr. Sigit Purnomohadi, Sp. PD", specialty: "Penyakit Dalam", status: "Idle", category: "NonBedah" },
        // Jantung
        { id: 131, name: "dr. Lita Hati Dwi PE, Sp. JP", specialty: "Jantung", status: "Idle", category: "NonBedah" },
        // Paru
        { id: 132, name: "dr. Oke Viska, Sp. P", specialty: "Paru", status: "Idle", category: "NonBedah" },
    ];

    // Helper to add shift
    const shifts: Shift[] = [];
    let sId = 1;
    const add = (docName: string, days: number[], time: string, tIdx: number = 0) => {
        const doc = newDoctors.find(d => d.name === docName);
        if (!doc) return;
        days.forEach(d => {
            shifts.push({
                id: sId++,
                dayIdx: d,
                timeIdx: tIdx,
                title: doc.specialty,
                doctor: doc.name,
                color: doc.category === 'Bedah' ? 'blue' : 'emerald',
                formattedTime: time
            });
        });
    };

    // Days: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    // NOTE: Image says "Senin" which usually starts the week.
    // JS getDay(): 0=Sun, 1=Mon.
    // My previous logic in route.ts: const dayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0, Sun=6
    // So 0 is Monday. Good.

    // Orthopaedi
    add("dr. Muhammad Luthfi, Sp. OT", [0, 5], "11:00-14:00"); // Senin, Sabtu
    add("dr. Muhammad Luthfi, Sp. OT", [1, 3, 4], "09:00-12:00"); // Selasa, Kamis, Jumat
    add("dr. Muhammad Luthfi, Sp. OT", [2], "07:00-08:00"); // Rabu

    add("dr. Nanda Notario, Sp. OT", [0, 5], "08:00-10:30"); // Senin, Sabtu
    add("dr. Nanda Notario, Sp. OT", [2], "11:00-14:00"); // Rabu

    // Bedah Umum - Endro
    add("dr. Endro RI Wibowo, Sp. B", [0, 1, 2, 3, 4, 5], "06:00-07:30"); // Pagi All
    add("dr. Endro RI Wibowo, Sp. B", [0, 1, 2, 3], "14:00-17:00"); // Sore Senin-Kamis
    add("dr. Endro RI Wibowo, Sp. B", [4], "13:00-17:00"); // Jumat

    // Urologi
    add("dr. Eko Subekti, Sp. U", [0, 2, 4], "18:00-21:00");

    // Kandungan
    add("dr. Gatot Hananta, Sp. OG", [1, 3, 5], "10:00-14:00");
    add("dr. Hepta Lidia, Sp. OG", [0, 2, 4], "10:00-14:00");
    add("dr. Pritasari Dewi D, Sp. OG", [0, 1, 3, 4], "14:30-17:00");
    add("dr. Ardian Rahmansyah, Sp. OG", [0, 2, 4], "18:30-21:00");

    // Anak
    add("dr. RR Irma Rossyana, Sp. A", [0, 1, 2, 3, 4, 5], "08:30-14:00");
    add("dr. Annisa Noor A, Sp. A", [0, 1, 2, 3, 4], "15:00-18:00");

    // Jiwa
    add("dr. Taufik Hidayanto, Sp. KJ", [0, 1, 3, 4], "14:30-17:00");
    add("dr. Nova Kurniasari, Sp. KJ", [0, 1, 2], "07:30-09:30");

    // Saraf
    add("dr. Ajeng Putri, Sp. N", [0], "15:00-18:00");
    add("dr. Ajeng Putri, Sp. N", [3], "13:00-16:00");
    add("dr. Ajeng Putri, Sp. N", [4], "14:00-17:00");

    add("dr. Setyo Dirahayu, Sp. N", [1, 2], "14:00-17:00");
    add("dr. Setyo Dirahayu, Sp. N", [5], "13:00-16:00");

    add("dr. Ahmad Tanji, Sp. N", [0], "06:00-08:00");
    add("dr. Ahmad Tanji, Sp. N", [2], "07:30-09:30");

    // Psikologi
    add("Siti K Sa'diyah, M. Psi. Psikologi", [0, 1, 2, 3, 4], "08:00-11:00");

    // Mata
    add("dr. Wahid Heru Widodo, Sp. M", [0, 4], "07:00-08:00");
    add("dr. Wahid Heru Widodo, Sp. M", [1, 2, 3], "07:00-12:00");

    // THT
    add("dr. Lirans Tia K, Sp. THT KL", [0, 2], "14:00-18:00");
    add("dr. Lirans Tia K, Sp. THT KL", [1, 3], "08:00-12:00");
    add("dr. Lirans Tia K, Sp. THT KL", [4], "13:00-15:00");

    add("dr. Wahyu Dwi K, Sp. THT KL", [3], "16:00-19:00");
    add("dr. Wahyu Dwi K, Sp. THT KL", [5], "14:00-17:00");

    // Gigi
    add("drg. Rafika Yusniar", [0, 2, 4], "14:30-17:00");
    add("drg. Yulinda Primilisa", [1, 3, 5], "14:30-17:00");
    add("drg. Dyah Tri Kusuma, Sp. KG", [2], "17:00-20:00");
    add("drg. Robby Ramadhonie, Sp. BMM", [1], "08:00-12:00");
    add("drg. Robby Ramadhonie, Sp. BMM", [4, 5], "14:00-17:00");

    // Rehab
    add("dr. Wati, SP. KFR", [0, 2, 3], "11:30-14:00");
    add("dr. Wati, SP. KFR", [1], "12:15-14:00");

    // Fisioterapi
    add("Bingsar Galih, Amd. Ftr", [0, 2, 3], "07:00-16:30");
    add("Panca Nugraha, Amd. Ftr", [1, 4, 5], "07:00-13:30");

    // VCT
    add("dr. Oktavia Adiyani", [2], "08:00-12:00");

    // Umum
    add("dr. Almer Belami", [0, 1, 2, 3, 4], "09:00-12:00");

    // Penyakit Dalam
    add("dr. Leo Chandra WPW, Sp. PD, M. KES", [0, 1, 2, 3, 4, 5], "09:00-14:00"); // Pagi
    add("dr. Leo Chandra WPW, Sp. PD, M. KES", [0, 1, 2, 3], "18:00-21:00"); // Sore

    add("dr. Sigit Purnomohadi, Sp. PD", [1], "14:30-17:00");
    add("dr. Sigit Purnomohadi, Sp. PD", [4], "13:30-16:00");

    // Jantung
    add("dr. Lita Hati Dwi PE, Sp. JP", [1, 3], "14:00-18:00");
    add("dr. Lita Hati Dwi PE, Sp. JP", [5], "08:00-14:00");

    // Paru
    add("dr. Oke Viska, Sp. P", [4], "10:00-13:00");
    add("dr. Oke Viska, Sp. P", [0, 1, 2], "13:00-16:00");
    add("dr. Oke Viska, Sp. P", [3, 5], "10:00-13:00"); // Assumption


    // Inject!
    // We need to bypass the standard store 'add' because we want to bulk replace
    // Since JSONStore doesn't expose 'setAll', we can just use fs in this special route
    // OR we iterate and add. Iterating is safer for memory but file I/O heavy.
    // The Store class is simple. Let's just use the store instances.

    // Actually, store doesn't have clearAll.
    // Let's use fs to overwrite the files directly.
    const fs = require('fs');
    const path = require('path');

    fs.writeFileSync(path.join(process.cwd(), 'src/data/doctors.json'), JSON.stringify(newDoctors, null, 2));
    fs.writeFileSync(path.join(process.cwd(), 'src/data/shifts.json'), JSON.stringify(shifts, null, 2));

    return NextResponse.json({ success: true, doctors: newDoctors.length, shifts: shifts.length });
}
