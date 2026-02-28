import { CircuitBreaker, CircuitState } from '@/lib/circuit-breaker';

describe('CircuitBreaker', () => {
  it('should initialize in CLOSED state', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
      name: 'test'
    });
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('should execute function on CLOSED state', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
      name: 'test'
    });
    
    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');
  });

  it('should open circuit after threshold failures', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      successThreshold: 2,
      timeout: 5000,
      name: 'test'
    });

    // Trigger failures
    for (let i = 0; i < 2; i++) {
      try {
        await cb.execute(async () => {
          throw new Error('fail');
        });
      } catch {}
    }

    expect(cb.getState()).toBe(CircuitState.OPEN);
  });

  it('should fail fast when OPEN', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 5000,
      name: 'test'
    });

    // Open the circuit
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {}

    // Should now be OPEN and fail fast
    await expect(
      cb.execute(async () => 'test')
    ).rejects.toThrow('Circuit breaker test is OPEN');
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      successThreshold: 1,
      timeout: 100, // Short timeout for test
      name: 'test'
    });

    // Open the circuit
    try {
      await cb.execute(async () => {
        throw new Error('fail');
      });
    } catch {}
    expect(cb.getState()).toBe(CircuitState.OPEN);

    // Wait for timeout
    await new Promise(r => setTimeout(r, 150));

    // Execute should attempt reset
    const result = await cb.execute(async () => 'recovered');
    expect(result).toBe('recovered');
    expect(cb.getState()).toBe(CircuitState.CLOSED);
  });

  it('should return metrics', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
      name: 'test'
    });

    const metrics = cb.getMetrics();
    expect(metrics.state).toBe(CircuitState.CLOSED);
    expect(metrics.failureCount).toBe(0);
    expect(metrics.successCount).toBe(0);
  });
});
