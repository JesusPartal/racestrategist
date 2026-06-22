import { RaceStrategy, DriverProfile, StrategySummaryDto, CreateStrategyRequest, UpdateStrategyRequest, StintDto } from '../models/types';
export declare function getAllStrategies(page?: number, limit?: number): StrategySummaryDto[];
export declare function getStrategyById(id: string): RaceStrategy | null;
export declare function createStrategy(req: CreateStrategyRequest): RaceStrategy | null;
export declare function updateStrategy(id: string, req: UpdateStrategyRequest): boolean;
export declare function updateStints(strategyId: string, stints: StintDto[]): boolean;
export declare function updateDrivers(strategyId: string, drivers: DriverProfile[]): boolean;
export declare function deleteStrategy(id: string): boolean;
//# sourceMappingURL=strategy.service.d.ts.map