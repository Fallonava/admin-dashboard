/**
 * Automation Queue
 * Handles retry logic, rate limiting, and backoff for doctor updates.
 * (In-Memory Implementation)
 */

import { CircuitBreaker } from './circuit-breaker';

export interface DoctorUpdateJob {
    id: string | number;
    status: 'TERJADWAL' | 'PENDAFTARAN' | 'PRAKTEK' | 'PENUH' | 'OPERASI' | 'CUTI' | 'SELESAI' | 'LIBUR' | string;
    attemptNumber?: number;
}

export interface QueueMetrics {
    active: number;
    delayed: number;
    failed: number;
    completed: number;
    waiting: number;
}

class AutomationQueueManager {
    private circuitBreaker: CircuitBreaker;
    private isInitialized = false;
    private isRunning = false;
    private queue: { job: DoctorUpdateJob; id: string; attempts: number; nextTry: number }[] = [];
    private failedJobs: any[] = [];
    
    private maxConcurrency = 5;
    private activeJobs = 0;
    private metrics: QueueMetrics = { active: 0, delayed: 0, failed: 0, completed: 0, waiting: 0 };

    constructor() {
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 5,
            successThreshold: 3,
            timeout: 30000, // 30 seconds
            name: 'AutomationQueue'
        });
    }

    /**
     * Initialize queue and scheduler
     */
    async initialize() {
        if (this.isInitialized) return;

        this.isInitialized = true;
        this.isRunning = true;
        this.processLoop();
        
        console.log('[AutomationQueue] In-Memory Queue Initialized successfully');
    }

    private async processLoop() {
        while (this.isRunning) {
            this.metrics.waiting = this.queue.filter(j => j.nextTry <= Date.now()).length;
            this.metrics.delayed = this.queue.filter(j => j.nextTry > Date.now()).length;

            if (this.activeJobs < this.maxConcurrency) {
                const now = Date.now();
                const jobIndex = this.queue.findIndex(j => j.nextTry <= now);
                
                if (jobIndex !== -1) {
                    // Extract job and process
                    const queuedJob = this.queue.splice(jobIndex, 1)[0];
                    this.activeJobs++;
                    this.metrics.active++;
                    
                    this.processJob(queuedJob).finally(() => {
                        this.activeJobs--;
                        this.metrics.active--;
                    });
                } else {
                    await new Promise(res => setTimeout(res, 200)); // Sleep slightly
                }
            } else {
                await new Promise(res => setTimeout(res, 200));
            }
        }
    }

    /**
     * Add a doctor update job to the queue
     */
    async addJob(update: DoctorUpdateJob): Promise<string> {
        if (!this.isInitialized) {
            throw new Error('Queue not initialized');
        }

        const id = Math.random().toString(36).substring(2, 9);
        this.queue.push({ job: update, id, attempts: 0, nextTry: Date.now() });
        return id;
    }

    /**
     * Batch add multiple jobs
     */
    async addBatch(updates: DoctorUpdateJob[]): Promise<string[]> {
        if (!this.isInitialized) {
            throw new Error('Queue not initialized');
        }

        const ids: string[] = [];
        for (const update of updates) {
            const id = Math.random().toString(36).substring(2, 9);
            this.queue.push({ job: update, id, attempts: 0, nextTry: Date.now() });
            ids.push(id);
        }
        return ids;
    }

    /**
     * Process a doctor update job with circuit breaker protection
     */
    private async processJob(queuedJob: { job: DoctorUpdateJob; id: string; attempts: number; nextTry: number }): Promise<void> {
        const update = queuedJob.job;

        try {
            await this.circuitBreaker.execute(async () => {
                const { prisma } = await import('./prisma');

                // Apply update to database
                await prisma.doctor.update({
                    where: { id: String(update.id) },
                    data: { status: update.status as any }
                });

                console.log(`[Queue] Updated doctor ${update.id} to ${update.status}`);
            });
            this.metrics.completed++;
        } catch (error) {
            console.error(`[Queue] Failed to process job ${queuedJob.id}:`, error);
            
            queuedJob.attempts++;
            if (queuedJob.attempts < 5) {
                // Exponential backoff
                queuedJob.nextTry = Date.now() + Math.pow(2, queuedJob.attempts) * 2000;
                this.queue.push(queuedJob);
            } else {
                this.metrics.failed++;
                this.failedJobs.unshift({
                    id: queuedJob.id,
                    data: queuedJob.job,
                    error: (error as Error).message,
                    attempts: queuedJob.attempts,
                    timestamp: Date.now()
                });
                
                // Keep only last 50 failed
                if (this.failedJobs.length > 50) this.failedJobs.pop();
            }
        }
    }

    /**
     * Get queue metrics
     */
    async getMetrics(): Promise<QueueMetrics> {
        // Update waiting/delayed counts before returning
        this.metrics.waiting = this.queue.filter(j => j.nextTry <= Date.now()).length;
        this.metrics.delayed = this.queue.filter(j => j.nextTry > Date.now()).length;
        return { ...this.metrics };
    }

    /**
     * Get failed jobs for inspection
     */
    async getFailedJobs(limit = 20): Promise<any[]> {
        return this.failedJobs.slice(0, limit);
    }

    /**
     * Retry a failed job
     */
    async retryJob(jobId: string): Promise<boolean> {
        const index = this.failedJobs.findIndex(j => j.id === jobId);
        if (index !== -1) {
            const failed = this.failedJobs.splice(index, 1)[0];
            this.metrics.failed--;
            this.queue.push({
                job: failed.data,
                id: failed.id,
                attempts: 0,
                nextTry: Date.now()
            });
            return true;
        }
        return false;
    }

    /**
     * Cleanup queue resources
     */
    async close() {
        this.isRunning = false;
        this.isInitialized = false;
    }

    getCircuitBreakerState() {
        return this.circuitBreaker.getMetrics();
    }

    isReady() {
        return this.isInitialized;
    }
}

// Singleton instance
let queueManager: AutomationQueueManager | null = null;

export function getAutomationQueue(): AutomationQueueManager {
    if (!queueManager) {
        queueManager = new AutomationQueueManager();
    }
    return queueManager;
}

export async function initializeAutomationQueue() {
    const queue = getAutomationQueue();
    await queue.initialize();
}
