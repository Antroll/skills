import { featureConfig } from './featureConfig';

/**
 * Picks the mock while Mock API mode is on, the real function otherwise.
 * The mock must take the same arguments and answer in the same shape, so the
 * type checker keeps it in step with the API.
 */
export function mockable<Args extends unknown[], Result>(
  real: (...args: Args) => Promise<Result>,
  mock: NoInfer<(...args: Args) => Promise<Result>>,
): (...args: Args) => Promise<Result> {
  return featureConfig.mockApi ? mock : real;
}

/**
 * The wait every mock starts with: `ms`, or 3 s while `mockSlow` is on.
 * Throws while `mockFailing` is on, so loading and error states can be seen
 * by hand.
 */
export async function mockWait(ms = 300): Promise<void> {
  await new Promise(resolve =>
    setTimeout(resolve, featureConfig.mockSlow ? 3000 : ms),
  );
  if (featureConfig.mockFailing) {
    throw new Error('Mock API: the mockFailing flag is on');
  }
}
