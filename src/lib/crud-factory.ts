import fs from 'fs';
import path from 'path';

export class JSONStore<T extends { id: string | number }> {
    private filePath: string;
    private defaultData: T[];

    constructor(fileName: string, defaultData: T[] = []) {
        this.filePath = path.join(process.cwd(), 'src', 'data', fileName);
        this.defaultData = defaultData;
    }

    private ensureFile() {
        if (!fs.existsSync(this.filePath)) {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.save(this.defaultData);
        }
    }

    getAll(): T[] {
        this.ensureFile();
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${this.filePath}`, error);
            return this.defaultData;
        }
    }

    getById(id: string | number): T | undefined {
        return this.getAll().find(item => item.id == id);
    }

    create(item: Omit<T, 'id'>): T {
        const items = this.getAll();
        const newItem = { ...item, id: Date.now() } as T; // Simple ID generation
        items.push(newItem);
        this.save(items);
        return newItem;
    }

    update(id: string | number, updates: Partial<T>): T | null {
        const items = this.getAll();
        const index = items.findIndex(item => item.id == id);
        if (index === -1) return null;

        items[index] = { ...items[index], ...updates };
        this.save(items);
        return items[index];
    }

    delete(id: string | number): boolean {
        const items = this.getAll();
        const filtered = items.filter(item => item.id != id);
        if (filtered.length === items.length) return false;
        this.save(filtered);
        return true;
    }

    private save(data: T[]) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}
