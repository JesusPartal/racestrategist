import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'es';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    currentLang = signal<Language>('es'); // Default to Spanish as requested in user prompt examples

    private readonly dictionary: Record<Language, Record<string, string>> = {
        en: {
            'app_title': 'RaceStrategist',
            'calculator_title': 'Race Strategy Calculator (Static)',
            'select_event': 'Select iRacing Event',
            'select_vehicle': 'Select Vehicle',
            'tank_capacity': 'Tank Capacity (L)',
            'fuel_consumption': 'Fuel consumption per lap (L)',
            'avg_lap_time': 'Avg. Lap Time (ms)',
            'predictions': 'Predictions',
            'max_laps': 'Max Laps per Stint',
            'stint_duration': 'Estimated Stint Duration',
            'total_race_time': 'Total Race Time',
            'estimated_stints': 'Estimated Stints',
            'team_strategy_title': 'Team Strategy (Stint Planner)',
            'add_driver': 'Add Driver',
            'driver_name': 'Driver Name',
            'driver_lap_time': 'Avg. Lap Time (ms)',
            'driver_fuel': 'Fuel / Lap (L)',
            'driver_error': 'Dev. Factor',
            'driver_color': 'Color',
            'stint_no': 'Stint #',
            'start_time': 'Start',
            'end_time': 'End',
            'no_stints': 'No stints calculated yet. Fill the static calculator first.'
        },
        es: {
            'app_title': 'RaceStrategist',
            'calculator_title': 'Calculadora de Estrategia (Estática)',
            'select_event': 'Seleccionar Evento iRacing',
            'select_vehicle': 'Seleccionar Vehículo',
            'tank_capacity': 'Capacidad del Tanque (L)',
            'fuel_consumption': 'Consumo por vuelta (L)',
            'avg_lap_time': 'Tiempo medio de vuelta (ms)',
            'predictions': 'Predicciones',
            'max_laps': 'Vueltas Máximas por Stint',
            'stint_duration': 'Duración Estimada del Stint',
            'total_race_time': 'Tiempo Total de Carrera',
            'estimated_stints': 'Stints Estimados',
            'team_strategy_title': 'Estrategia de Equipo (Planificador)',
            'add_driver': 'Añadir Piloto',
            'driver_name': 'Nombre Piloto',
            'driver_lap_time': 'Méd. Vuelta (ms)',
            'driver_fuel': 'Consumo / Lap (L)',
            'driver_error': 'Factor Dev. (%)',
            'driver_color': 'Color',
            'stint_no': 'Stint #',
            'start_time': 'Inicio',
            'end_time': 'Fin',
            'no_stints': 'Stints no calculados. Rellena la calculadora estática primero.'
        }
    };

    translate(key: string): string {
        return this.dictionary[this.currentLang()][key] || key;
    }

    setLanguage(lang: Language) {
        this.currentLang.set(lang);
    }
}
