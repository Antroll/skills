import { featureConfig } from './featureConfig';

export function mockable<Args extends unknown[], Result>(
  real: (...args: Args) => Promise<Result>,
  // NoInfer: the types come from `real` alone, so a mock whose arguments or
  // response differ is an error instead of widening the inferred types.
  mock: NoInfer<(...args: Args) => Promise<Result>>,
): (...args: Args) => Promise<Result> {
  return featureConfig.mockApi ? mock : real;
}

export async function mockWait(ms = 300): Promise<void> {
  await new Promise(resolve =>
    setTimeout(resolve, featureConfig.mockSlow ? 3000 : ms),
  );
  if (featureConfig.mockFailing) {
    throw new Error('Mock API: the mockFailing flag is on');
  }
}
