import { afterEach, describe, expect, it, vi } from 'vitest';
import { featureConfig } from './featureConfig';
import { mockable, mockWait } from './mockable';

async function fetchGreeting(name: string) {
  return { greeting: `Hello from the API, ${name}` };
}

async function mockFetchGreeting(name: string) {
  return { greeting: `Hello from a mock, ${name}` };
}

afterEach(() => {
  featureConfig.mockApi = false;
  featureConfig.mockSlow = false;
  featureConfig.mockFailing = false;
  vi.useRealTimers();
});

describe('mockable', () => {
  it('calls the real function when Mock API mode is off', async () => {
    const mock = vi.fn(mockFetchGreeting);

    const result = await mockable(fetchGreeting, mock)('Anna');

    expect(result).toEqual({ greeting: 'Hello from the API, Anna' });
    expect(mock).not.toHaveBeenCalled();
  });

  it('calls the mock with the same arguments when Mock API mode is on', async () => {
    featureConfig.mockApi = true;
    const real = vi.fn(fetchGreeting);

    const result = await mockable(real, mockFetchGreeting)('Anna');

    expect(result).toEqual({ greeting: 'Hello from a mock, Anna' });
    expect(real).not.toHaveBeenCalled();
  });

  it('rejects a mock whose response has another shape', () => {
    async function mockWithOtherShape(name: string) {
      return { message: name };
    }

    // @ts-expect-error The mock must answer in the real function's shape.
    mockable(fetchGreeting, mockWithOtherShape);
  });
});

describe('mockWait', () => {
  it('waits the given time', async () => {
    vi.useFakeTimers();
    let done = false;
    void mockWait(500).then(() => (done = true));

    await vi.advanceTimersByTimeAsync(499);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it('waits 3 s while mockSlow is on', async () => {
    featureConfig.mockSlow = true;
    vi.useFakeTimers();
    let done = false;
    void mockWait().then(() => (done = true));

    await vi.advanceTimersByTimeAsync(2999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it('fails while mockFailing is on', async () => {
    featureConfig.mockFailing = true;

    await expect(mockWait(0)).rejects.toThrow('mockFailing');
  });
});
