import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { lastValueFrom } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class IracingApiService {
  private http = inject(HttpClient);

  loading = signal(false);
  error = signal<string | null>(null);
  cars = signal<IracingCar[]>([]);

  async fetchCars(): Promise<IracingCar[]> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const cars = await lastValueFrom(
        this.http.get<IracingCar[]>(`${API_BASE}/iracing/cars`)
      );
      this.cars.set(cars);
      return cars;
    } catch (err: any) {
      this.error.set(err.error?.error || 'Failed to load iRacing cars');
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async syncCars(): Promise<{ count: number } | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await lastValueFrom(
        this.http.post<{ synced: boolean; count: number }>(`${API_BASE}/iracing/sync`, {})
      );
      await this.fetchCars();
      return { count: result.count };
    } catch (err: any) {
      this.error.set(err.error?.error || 'Failed to sync iRacing cars');
      return null;
    } finally {
      this.loading.set(false);
    }
  }
}
