const CACHE_TTL_MS = 3600_000;
let carsCache: any[] | null = null;
let carsCacheTime = 0;

export interface IracingCar {
  carId: number;
  carName: string;
  carNameAbbreviated: string;
  categories: string[];
  carTypes: { carType: string }[];
  freeWithSubscription: boolean;
  retired: boolean;
  price: number;
  carMake?: string | null;
  carModel?: string | null;
}

async function getClient(): Promise<any> {
  const mod = await import('iracing-api');
  const IracingAPI = mod.default || mod;

  const email = process.env.IRACING_EMAIL;
  const password = process.env.IRACING_PASSWORD;
  if (!email || !password) {
    throw new Error('IRACING_EMAIL and IRACING_PASSWORD env vars are required');
  }

  const client = new IracingAPI({ manageRateLimit: true });
  const result = await client.login(email, password);
  if (result?.error) {
    throw new Error(`iRacing login failed: ${result.error}`);
  }
  return client;
}

export async function getCars(forceRefresh = false): Promise<IracingCar[]> {
  if (!forceRefresh && carsCache && (Date.now() - carsCacheTime) < CACHE_TTL_MS) {
    return carsCache;
  }

  const client = await getClient();
  const raw = await client.car.getCars();
  if (!raw) {
    throw new Error('Failed to fetch cars from iRacing API');
  }

  const mapped: IracingCar[] = raw.map((c: any) => ({
    carId: c.carId,
    carName: c.carName,
    carNameAbbreviated: c.carNameAbbreviated,
    categories: c.categories || [],
    carTypes: c.carTypes || [],
    freeWithSubscription: c.freeWithSubscription ?? true,
    retired: c.retired ?? false,
    price: c.price ?? 0,
    carMake: c.carMake ?? null,
    carModel: c.carModel ?? null,
  }));

  carsCache = mapped;
  carsCacheTime = Date.now();
  return mapped;
}

export function clearCache(): void {
  carsCache = null;
  carsCacheTime = 0;
}
