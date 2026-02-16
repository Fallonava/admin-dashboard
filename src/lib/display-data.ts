import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/data/display-db.json');

export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    status: 'BUKA' | 'PENUH' | 'OPERASI' | 'CUTI' | 'SELESAI' | 'TIDAK PRAKTEK';
    startTime: string;
    endTime: string;
    queueCode: string;
    category: 'Bedah' | 'NonBedah';
}

export interface Message {
    id: string;
    text: string;
    active: boolean;
}

export interface DisplayData {
    doctors: Doctor[];
    messages: Message[];
    settings: {
        runTextMessage: string;
        emergencyMode: boolean;
    };
}

export function getDisplayData(): DisplayData {
    if (!fs.existsSync(DB_PATH)) {
        // Return default structure if file doesn't exist
        return {
            doctors: [],
            messages: [],
            settings: { runTextMessage: "", emergencyMode: false }
        };
    }
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(fileContent);
}

export function saveDisplayData(data: DisplayData): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function updateDoctorStatus(id: string, status: Doctor['status']) {
    const data = getDisplayData();
    const doctor = data.doctors.find(d => d.id === id);
    if (doctor) {
        doctor.status = status;
        saveDisplayData(data);
    }
}
