import { JSONStore } from './crud-factory';

// --- Schedules Types ---
export interface Shift {
    id: number;
    dayIdx: number; // 0-6 (Mon-Sun)
    timeIdx: number; // Keep for legacy compatibility/sorting
    title: string;
    doctor: string;
    color: string;
    formattedTime?: string; // e.g. "09:00-14:00"
    extra?: string;
}

export interface LeaveRequest {
    id: number;
    doctor: string;
    specialty?: string;
    type: 'Sick Leave' | 'Vacation' | 'Personal' | 'Conference';
    dates: string;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    avatar?: string;
}

// --- Doctor Types ---
export interface Doctor {
    id: number;
    name: string;
    specialty: string;
    status: 'Idle' | 'Buka' | 'Penuh' | 'Cuti' | 'Istirahat' | 'Selesai';
    image?: string;
    category: 'Bedah' | 'NonBedah';
    lastCall?: string;
}

// --- Automation Types ---
export interface BroadcastRule {
    id: number;
    message: string;
    alertLevel: 'Information' | 'Warning' | 'Critical';
    targetZone: 'All Zones' | 'Lobby Only' | 'ER & Wards';
    duration: number; // minutes
    active: boolean;
}

export interface Settings {
    id: number;
    automationEnabled: boolean;
}

// --- Initial Data ---
const INITIAL_SHIFTS: Shift[] = [
    { id: 1, dayIdx: 0, timeIdx: 0, title: "Surgery", doctor: "Dr. Sarah", color: "blue" },
    { id: 2, dayIdx: 2, timeIdx: 0, title: "Consultation", doctor: "Dr. James", color: "emerald" },
    { id: 3, dayIdx: 5, timeIdx: 0, title: "ER Duty", doctor: "Dr. Chen", color: "purple" },
];

const INITIAL_LEAVE: LeaveRequest[] = [
    {
        id: 1,
        doctor: "Dr. Sarah Johnson",
        specialty: "Sp. Bedah",
        type: "Vacation",
        dates: "Oct 24 - 28",
        reason: "Annual family vacation",
        status: "Pending",
        avatar: "/avatars/dr-sarah.png"
    },
    {
        id: 2,
        doctor: "Dr. Michael Chen",
        specialty: "Sp. Anak",
        type: "Conference",
        dates: "Nov 05 - 07",
        reason: "International Pediatrics Conference",
        status: "Approved",
        avatar: "/avatars/dr-mike.png"
    },
];

const INITIAL_DOCTORS: Doctor[] = [
    { id: 1, name: "Dr. Sarah Johnson", specialty: "Sp. Bedah", status: "Idle", category: "Bedah", lastCall: "08:00" },
    { id: 2, name: "Dr. James Wilson", specialty: "Sp. Penyakit Dalam", status: "Idle", category: "NonBedah" },
    { id: 3, name: "Dr. Michael Chen", specialty: "Sp. Anak", status: "Idle", category: "NonBedah" },
];

const INITIAL_BROADCAST: BroadcastRule[] = [
    { id: 1, message: "Welcome to RSU Siaga Medika", alertLevel: "Information", targetZone: "All Zones", duration: 60, active: true }
];

const INITIAL_SETTINGS: Settings[] = [
    { id: 1, automationEnabled: false }
];

// --- Stores ---
export const shiftStore = new JSONStore<Shift>('shifts.json', INITIAL_SHIFTS);
export const leaveStore = new JSONStore<LeaveRequest>('leaves.json', INITIAL_LEAVE);
export const doctorStore = new JSONStore<Doctor>('doctors.json', INITIAL_DOCTORS);
export const broadcastStore = new JSONStore<BroadcastRule>('broadcasts.json', INITIAL_BROADCAST);
export const settingsStore = new JSONStore<Settings>('settings.json', INITIAL_SETTINGS);
