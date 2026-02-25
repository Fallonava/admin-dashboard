import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Shift } from '@/lib/data-service';

export async function GET() {
    const newDoctors = [
        {
            "id": "103",
            "name": "dr. Endro RI Wibowo, Sp. B",
            "specialty": "Bedah Umum",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "BP",
            "startTime": "06:00",
            "endTime": "13:00"
        },
        {
            "id": "1031",
            "name": "dr. Endro RI Wibowo, Sp. B",
            "specialty": "Bedah Umum (Siang)",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "BS",
            "startTime": "13:00",
            "endTime": "17:00"
        },
        {
            "id": "123",
            "name": "drg. Robby Ramadhonie, Sp. BMM",
            "specialty": "Gigi Bedah Mulut",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "BM",
            "startTime": "08:00",
            "endTime": "12:00"
        },
        {
            "id": "108",
            "name": "dr. Ardian Rahmansyah, Sp. OG",
            "specialty": "Kandungan (Malam)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "KM",
            "startTime": "18:30",
            "endTime": "21:00"
        },
        {
            "id": "105",
            "name": "dr. Gatot Hananta, Sp. OG",
            "specialty": "Kandungan (Pagi)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "KP",
            "startTime": "10:00",
            "endTime": "14:00"
        },
        {
            "id": "107",
            "name": "dr. Pritasari Dewi D, Sp. OG",
            "specialty": "Kandungan (Sore)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "KS",
            "startTime": "14:30",
            "endTime": "17:00"
        },
        {
            "id": "117",
            "name": "dr. Wahid Heru Widodo, Sp. M",
            "specialty": "Mata",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "M",
            "startTime": "07:00",
            "endTime": "12:00"
        },
        {
            "id": "101",
            "name": "dr. Muhammad Luthfi, Sp. OT",
            "specialty": "Orthopaedi",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "OL",
            "startTime": "09:00",
            "endTime": "14:00"
        },
        {
            "id": "102",
            "name": "dr. Nanda Notario, Sp. OT",
            "specialty": "Orthopaedi",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "ON",
            "startTime": "08:00",
            "endTime": "10:30"
        },
        {
            "id": "118",
            "name": "dr. Lirans Tia K, Sp. THT KL",
            "specialty": "THT-KL",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "TP",
            "startTime": "08:00",
            "endTime": "12:00"
        },
        {
            "id": "119",
            "name": "dr. Wahyu Dwi K, Sp. THT KL",
            "specialty": "THT-KL",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "TS",
            "startTime": "16:00",
            "endTime": "19:00"
        },
        {
            "id": "104",
            "name": "dr. Eko Subekti, Sp. U",
            "specialty": "Urologi",
            "status": "TIDAK PRAKTEK",
            "category": "Bedah",
            "queueCode": "U",
            "startTime": "18:00",
            "endTime": "21:00"
        },
        {
            "id": "109",
            "name": "dr. RR Irma Rossyana, Sp. A",
            "specialty": "Anak",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "AP",
            "startTime": "08:30",
            "endTime": "14:00"
        },
        {
            "id": "110",
            "name": "dr. Annisa Noor A, Sp. A",
            "specialty": "Anak (Sore)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "AS",
            "startTime": "15:00",
            "endTime": "18:00"
        },
        {
            "id": "131",
            "name": "dr. Lita Hati Dwi PE, Sp. JP",
            "specialty": "Jantung & Pembuluh Darah",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "H",
            "startTime": "08:00",
            "endTime": "14:00"
        },
        {
            "id": "112",
            "name": "dr. Nova Kurniasari, Sp. KJ",
            "specialty": "Kesehatan Jiwa",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "JP",
            "startTime": "07:30",
            "endTime": "09:30"
        },
        {
            "id": "111",
            "name": "dr. Taufik Hidayanto, Sp. KJ",
            "specialty": "Kesehatan Jiwa",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "JS",
            "startTime": "14:30",
            "endTime": "17:00"
        },
        {
            "id": "130",
            "name": "dr. Sigit Purnomohadi, Sp. PD",
            "specialty": "Penyakit Dalam",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "DS",
            "startTime": "13:30",
            "endTime": "16:00"
        },
        {
            "id": "129",
            "name": "dr. Leo Chandra WPW, Sp. PD, M. KES",
            "specialty": "Penyakit Dalam (Pagi)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "DP",
            "startTime": "09:00",
            "endTime": "14:00"
        },
        {
            "id": "1291",
            "name": "dr. Leo Chandra WPW, Sp. PD, M. KES",
            "specialty": "Penyakit Dalam (Sore)",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "DM",
            "startTime": "18:00",
            "endTime": "21:00"
        },
        {
            "id": "132",
            "name": "dr. Oke Viska, Sp. P",
            "specialty": "Penyakit Paru",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "P",
            "startTime": "10:00",
            "endTime": "13:00"
        },
        {
            "id": "124",
            "name": "dr. Wati, SP. KFR",
            "specialty": "Rehab Medik",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "RM",
            "startTime": "11:30",
            "endTime": "14:00"
        },
        {
            "id": "1234",
            "name": "dr. Setyo Dirahayu, Sp. N",
            "specialty": "Saraf",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "SS",
            "startTime": "13:00",
            "endTime": "16:00"
        },
        {
            "id": "127",
            "name": "dr. Ahmad Tanji, Sp. N",
            "specialty": "Saraf",
            "status": "TIDAK PRAKTEK",
            "category": "NonBedah",
            "queueCode": "SP",
            "startTime": "06:00",
            "endTime": "09:30"
        }
    ];

    const shifts: any[] = [];

    // Using simple counter ID 1,2,3 for shifts. 
    // Wait, BigInt DB doesn't like passing bigints to createMany sometimes but number is fine if the schema supports it.
    let sId = 1;

    const add = (qCode: string, days: number[], time: string, tIdx: number = 0) => {
        const doc = newDoctors.find(d => d.queueCode === qCode);
        if (!doc) return;
        days.forEach(d => {
            shifts.push({
                id: sId++,
                dayIdx: d,
                timeIdx: tIdx,
                title: doc.specialty,
                doctor: doc.name,
                color: doc.category === 'Bedah' ? 'blue' : 'emerald',
                formattedTime: time,
                disabledDates: []
            });
        });
    };

    add("OL", [0, 5], "11:00-14:00");
    add("OL", [1, 3, 4], "09:00-12:00");
    add("OL", [2], "07:00-08:00");
    add("ON", [0, 5], "08:00-10:30");
    add("ON", [2], "11:00-14:00");
    add("BP", [0, 1, 2, 3, 4, 5], "06:00-07:30");
    add("BS", [0, 1, 2, 3], "14:00-17:00");
    add("BS", [4], "13:00-17:00");
    add("U", [0, 2, 4], "18:00-21:00");
    add("KP", [1, 3, 5], "10:00-14:00");
    add("KS", [0, 1, 3, 4], "14:30-17:00");
    add("KM", [0, 2, 4], "18:30-21:00");
    add("AP", [0, 1, 2, 3, 4, 5], "08:30-14:00");
    add("AS", [0, 1, 2, 3, 4], "15:00-18:00");
    add("JS", [0, 1, 3, 4], "14:30-17:00");
    add("JP", [0, 1, 2], "07:30-09:30");
    add("SS", [1, 2], "14:00-17:00");
    add("SS", [5], "13:00-16:00");
    add("SP", [0], "06:00-08:00");
    add("SP", [2], "07:30-09:30");
    add("M", [0, 4], "07:00-08:00");
    add("M", [1, 2, 3], "07:00-12:00");
    add("TP", [0, 2], "14:00-18:00");
    add("TP", [1, 3], "08:00-12:00");
    add("TP", [4], "13:00-15:00");
    add("TS", [3], "16:00-19:00");
    add("TS", [5], "14:00-17:00");
    add("BM", [1], "08:00-12:00");
    add("BM", [4, 5], "14:00-17:00");
    add("RM", [0, 2, 3], "11:30-14:00");
    add("RM", [1], "12:15-14:00");
    add("DP", [0, 1, 2, 3, 4, 5], "09:00-14:00");
    add("DM", [0, 1, 2, 3], "18:00-21:00");
    add("DS", [1], "14:30-17:00");
    add("DS", [4], "13:30-16:00");
    add("H", [1, 3], "14:00-18:00");
    add("H", [5], "08:00-14:00");
    add("P", [4], "10:00-13:00");
    add("P", [0, 1, 2], "13:00-16:00");
    add("P", [3, 5], "10:00-13:00");

    // Clean DB and reinsert
    await prisma.shift.deleteMany({});
    await prisma.doctor.deleteMany({});

    await prisma.doctor.createMany({ data: newDoctors });
    await prisma.shift.createMany({ data: shifts });

    return NextResponse.json({ success: true, doctors: newDoctors.length, shifts: shifts.length });
}
