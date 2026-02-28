import { JSONStore } from './crud-factory';

// --- Schedules Types ---
export interface Shift {
    id: string; // Changed: cuid
    dayIdx: number;
    timeIdx: number;
    title: string;
    doctorId: string; // Changed: foreign key
    doctor?: string;  // name mapped for UI simplicity
    doctorRel?: Doctor;  // Optional populated relation
    color: string;
    formattedTime?: string;
    registrationTime?: string;
    extra?: string;
    disabledDates?: string[];
    statusOverride?: Doctor['status'] | null;
}

export interface LeaveRequest {
    id: string; // Changed: cuid
    doctorId: string; // Changed: foreign key
    doctor?: string; // name mapped for UI simplicity
    doctorRel?: Doctor; // Optional populated relation
    specialty?: string;
    type: 'Sakit' | 'Liburan' | 'Pribadi' | 'Konferensi' | 'Lainnya';
    startDate: Date; // Changed
    endDate: Date; // Changed
    reason?: string;
    status: string; // Changed: Added missing field
    avatar?: string;
}

// --- Doctor Types ---
export interface Doctor {
    id: string; // Changed to simple string everywhere (cuid)
    name: string;
    specialty: string;
    status: 'BUKA' | 'PENUH' | 'OPERASI' | 'CUTI' | 'SELESAI' | 'AKAN_BUKA' | 'TIDAK PRAKTEK' | 'TIDAK_PRAKTEK';
    image?: string;
    category: 'Bedah' | 'NonBedah';
    startTime: string; // e.g., "08:00"
    endTime: string;   // e.g., "14:00"
    queueCode: string; // e.g., "A-01" or "BP"
    lastCall?: string;
    registrationTime?: string; // e.g. "07:30"
    lastManualOverride?: number; // Timestamp of last manual status change
}

// --- Automation Types ---
export interface BroadcastRule {
    id: string; // Changed: cuid
    message: string;
    alertLevel: 'Information' | 'Warning' | 'Critical';
    targetZone: 'All Zones' | 'Lobby Only' | 'ER & Wards';
    duration: number; // minutes
    active: boolean;
}

export interface Settings {
    id: string; // Changed: cuid

    automationEnabled: boolean;
    runTextMessage?: string;
    emergencyMode?: boolean;
    customMessages?: { title: string; text: string }[];
}

// --- Initial Data ---
const INITIAL_SHIFTS: Shift[] = [
    { id: "s-1", dayIdx: 0, timeIdx: 0, title: "Surgery", doctorId: "dr-1", color: "blue" },
    { id: "s-2", dayIdx: 2, timeIdx: 0, title: "Consultation", doctorId: "dr-2", color: "emerald" },
    { id: "s-3", dayIdx: 5, timeIdx: 0, title: "ER Duty", doctorId: "dr-3", color: "purple" },
];

const INITIAL_LEAVE: LeaveRequest[] = [
    {
        id: "l-1",
        doctorId: "dr-1",
        specialty: "Sp. Bedah",
        type: "Liburan",
        startDate: new Date("2024-10-24"),
        endDate: new Date("2024-10-28"),
        reason: "Annual family vacation",
        status: "APPROVED",
        avatar: "/avatars/dr-sarah.png"
    },
    {
        id: "l-2",
        doctorId: "dr-3",
        specialty: "Sp. Anak",
        type: "Konferensi",
        startDate: new Date("2024-11-05"),
        endDate: new Date("2024-11-07"),
        reason: "International Pediatrics Conference",
        status: "APPROVED",
        avatar: "/avatars/dr-mike.png"
    },
];

const INITIAL_DOCTORS: Doctor[] = [
    {
        id: "dr-1",
        name: "Dr. Sarah Johnson",
        specialty: "Sp. Bedah",
        status: "BUKA",
        category: "Bedah",
        startTime: "08:00",
        endTime: "14:00",
        queueCode: "B-01",
        lastCall: "08:00"
    },
    {
        id: "dr-2",
        name: "Dr. James Wilson",
        specialty: "Sp. Penyakit Dalam",
        status: "CUTI",
        category: "NonBedah",
        startTime: "09:00",
        endTime: "15:00",
        queueCode: "A-01"
    },
    {
        id: "dr-3",
        name: "Dr. Michael Chen",
        specialty: "Sp. Anak",
        status: "PENUH",
        category: "NonBedah",
        startTime: "08:00",
        endTime: "12:00",
        queueCode: "C-01"
    },
];

const INITIAL_BROADCAST: BroadcastRule[] = [
    { id: "b-1", message: "Welcome to RSU Siaga Medika", alertLevel: "Information", targetZone: "All Zones", duration: 60, active: true }
];

const INITIAL_SETTINGS: Settings[] = [
    {
        id: "1",
        automationEnabled: false,
        runTextMessage: "Selamat Datang di RSU Siaga Medika - Melayani dengan Sepenuh Hati",
        emergencyMode: false,
        customMessages: [
            { title: 'Info', text: 'Terimakasih sudah menunggu 🙏' },
            { title: 'Info', text: 'Terimakasih sudah tertib 🌟' },
            { title: 'Antrian', text: 'Belum online? Yo ambil antrian 🎫' },
            { title: 'Info', text: 'Terimakasih sudah mengantri 😊' }
        ]
    }
];

// --- Stores ---
export const shiftStore = new JSONStore<Shift>('shifts.json', INITIAL_SHIFTS);
export const leaveStore = new JSONStore<LeaveRequest>('leaves.json', INITIAL_LEAVE);
export const doctorStore = new JSONStore<Doctor>('doctors-v2.json', INITIAL_DOCTORS); // Changed filename to avoid conflict/migration issues
export const broadcastStore = new JSONStore<BroadcastRule>('broadcasts.json', INITIAL_BROADCAST);
export const settingsStore = new JSONStore<Settings>('settings-v2.json', INITIAL_SETTINGS);
