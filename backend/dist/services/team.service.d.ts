import { TeamDriver, DriverDto } from '../models/types';
export declare function getSettings(): {
    teamName: string;
};
export declare function updateSettings(updates: {
    teamName?: string;
}): boolean;
export declare function getAllDrivers(page?: number, limit?: number): TeamDriver[];
export declare function addDriver(dto: DriverDto): TeamDriver;
export declare function updateDriver(id: string, dto: DriverDto): boolean;
export declare function deleteDriver(id: string): boolean;
//# sourceMappingURL=team.service.d.ts.map