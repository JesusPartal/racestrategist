import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IRacingEvent, Vehicle } from '../models/race-strategy.model';

@Injectable({
    providedIn: 'root'
})
export class CatalogService {

    private readonly events: IRacingEvent[] = [
        { id: '1', name: '24h of Daytona', trackId: 'daytona_road', durationMinutes: 1440, allowedCarClasses: ['GTP', 'LMP2', 'GT3'] },
        { id: '2', name: 'Nurburgring 24h', trackId: 'nurburgring_combined', durationMinutes: 1440, allowedCarClasses: ['GT3', 'CUP'] },
        { id: '3', name: 'Sebring 12h', trackId: 'sebring_intl', durationMinutes: 720, allowedCarClasses: ['GTP', 'LMP2', 'GT3'] }
    ];

    private readonly vehicles: Vehicle[] = [
        { id: 'porsche_gt3', name: 'Porsche 911 GT3 R (992)', fuelTankCapacityL: 110, refuelRateLS: 2.2, vehicleClass: 'GT3' },
        { id: 'bmw_gt3', name: 'BMW M4 GT3', fuelTankCapacityL: 115, refuelRateLS: 2.2, vehicleClass: 'GT3' },
        { id: 'cadillac_gtp', name: 'Cadillac V-Series.R', fuelTankCapacityL: 90, refuelRateLS: 3.5, vehicleClass: 'GTP' },
        { id: 'dallara_lmp2', name: 'Dallara P217', fuelTankCapacityL: 75, refuelRateLS: 3.0, vehicleClass: 'LMP2' }
    ];

    getEvents(): Observable<IRacingEvent[]> {
        return of(this.events);
    }

    getVehiclesByEvent(eventId: string): Observable<Vehicle[]> {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return of([]);

        return of(this.vehicles.filter(v => event.allowedCarClasses.includes(v.vehicleClass)));
    }

    getVehicleById(id: string): Observable<Vehicle | undefined> {
        return of(this.vehicles.find(v => v.id === id));
    }
}
