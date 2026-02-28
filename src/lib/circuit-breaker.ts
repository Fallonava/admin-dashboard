/**
 * Circuit Breaker pattern implementation
 * Prevents cascading failures by failing fast when service is unhealthy
 */

export interface CircuitBreakerConfig {
    failureThreshold: number;      // Number of failures before opening circuit
    successThreshold: number;      // Number of successes before closing circuit
    timeout: number;               // Time in ms to wait before half-open
    name: string;
}

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime: number | null = null;
    private config: CircuitBreakerConfig;

    constructor(config: CircuitBreakerConfig) {
        this.config = config;
    }

    /**
     * Execute function with circuit breaker protection
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.state = CircuitState.HALF_OPEN;
                console.log(`[CircuitBreaker ${this.config.name}] Attempting reset (HALF_OPEN)`);
            } else {
                throw new Error(`Circuit breaker ${this.config.name} is OPEN`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.close();
            }
        }
    }

    private onFailure() {
        this.lastFailureTime = Date.now();
        this.failureCount++;

        if (this.failureCount >= this.config.failureThreshold) {
            this.open();
        }
    }

    private open() {
        this.state = CircuitState.OPEN;
        console.warn(`[CircuitBreaker ${this.config.name}] OPEN — requests will fail fast`);
    }

    private close() {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`[CircuitBreaker ${this.config.name}] CLOSED — recovered`);
    }

    private shouldAttemptReset(): boolean {
        if (this.lastFailureTime === null) return true;
        return Date.now() - this.lastFailureTime >= this.config.timeout;
    }

    getState(): CircuitState {
        return this.state;
    }

    getMetrics() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null
        };
    }
}
