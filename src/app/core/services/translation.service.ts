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
            'calculator_title': 'Race Strategy Calculator',
            'editing_strategy': 'EDITING STRATEGY',
            'new_strategy': 'NEW STRATEGY',
            'unsaved': '● UNSAVED',
            'save': 'SAVE',
            'discard': 'DISCARD',
            'select_event': 'Select iRacing Event',
            'select_vehicle': 'Select Vehicle',
            'tank_capacity': 'Tank Capacity (L)',
            'fuel_consumption': 'Fuel consumption per lap (L)',
            'avg_lap_time': 'Avg. Lap Time (ms)',
            'pit_no_tires': 'PIT (NO TIRES)',
            'pit_with_tires': 'PIT (WITH TIRES)',
            'sec': 'SEC',
            'predictions': 'Predictions',
            'max_laps': 'Max Laps per Stint',
            'stint_duration': 'Estimated Stint Duration',
            'total_race_time': 'Total Race Time',
            'estimated_stints': 'Estimated Stints',
            'generate_plan': 'Generate Strategy Plan',
            'fill_data_first': '⚠ Fill consumption data first',
            'max_stints_msg': '⚠ Max 1000 stints allowed (Current: {{count}})',
            'team_strategy_title': 'Team Strategy (Stint Planner)',
            'team_roster': 'TEAM: Roster',
            'roster_hint': 'Select drivers from your team roster for stint assignment.',
            'manage_roster': 'Manage roster →',
            'plan_label': 'PLAN:',
            'add_driver': 'Add Driver',
            'driver_name': 'Driver Name',
            'driver_lap_time': 'Avg. Lap Time (ms)',
            'driver_fuel': 'Fuel / Lap (L)',
            'driver_error': 'Dev. Factor',
            'driver_color': 'Color',
            'stint_no': 'STINT #',
            'stint_laps': 'LAPS',
            'change_tires': 'CHANGE TIRES',
            'extra_sec': '+ SEC',
            'start_time': 'Start',
            'end_time': 'End',
            'overview_matrix': 'Race Overview Matrix',
            'no_stints': 'No stints calculated yet. Fill the static calculator first.',
            'loading': 'Loading...',
            'error_generic': 'An error occurred',
            'retry': 'RETRY',
            'real_time_data': 'Real-Time Data',
            'laps': 'LAPS',
            'unassigned': 'UNASSIGNED',
        },
        es: {
            'app_title': 'RaceStrategist',
            'calculator_title': 'Calculadora de Estrategia',
            'editing_strategy': 'EDITANDO ESTRATEGIA',
            'new_strategy': 'NUEVA ESTRATEGIA',
            'unsaved': '● SIN GUARDAR',
            'save': 'GUARDAR',
            'discard': 'DESCARTAR',
            'select_event': 'Seleccionar Evento iRacing',
            'select_vehicle': 'Seleccionar Vehículo',
            'tank_capacity': 'Capacidad del Tanque (L)',
            'fuel_consumption': 'Consumo por vuelta (L)',
            'avg_lap_time': 'Tiempo medio de vuelta (ms)',
            'pit_no_tires': 'BOXEO (SIN NEUMÁTICOS)',
            'pit_with_tires': 'BOXEO (CON NEUMÁTICOS)',
            'sec': 'SEG',
            'predictions': 'Predicciones',
            'max_laps': 'Vueltas Máximas por Stint',
            'stint_duration': 'Duración Estimada del Stint',
            'total_race_time': 'Tiempo Total de Carrera',
            'estimated_stints': 'Stints Estimados',
            'generate_plan': 'Generar Plan de Estrategia',
            'fill_data_first': '⚠ Rellena los datos de consumo primero',
            'max_stints_msg': '⚠ Máximo 1000 stints permitidos (Actual: {{count}})',
            'team_strategy_title': 'Estrategia de Equipo (Planificador)',
            'team_roster': 'EQUIPO: Plantilla',
            'roster_hint': 'Selecciona pilotos de tu equipo para asignar a los stints.',
            'manage_roster': 'Gestionar plantilla →',
            'plan_label': 'PLAN:',
            'add_driver': 'Añadir Piloto',
            'driver_name': 'Nombre Piloto',
            'driver_lap_time': 'Méd. Vuelta (ms)',
            'driver_fuel': 'Consumo / Lap (L)',
            'driver_error': 'Factor Dev. (%)',
            'driver_color': 'Color',
            'stint_no': 'STINT #',
            'stint_laps': 'VUELTAS',
            'change_tires': 'CAMBIAR NEUMÁTICOS',
            'extra_sec': '+ SEG',
            'start_time': 'Inicio',
            'end_time': 'Fin',
            'overview_matrix': 'Matriz de Visión General',
            'no_stints': 'Stints no calculados. Rellena la calculadora primero.',
            'loading': 'Cargando...',
            'error_generic': 'Ocurrió un error',
            'retry': 'REINTENTAR',
            'real_time_data': 'Datos en Tiempo Real',
            'laps': 'VUELTAS',
            'unassigned': 'SIN ASIGNAR',
        }
    };

    translate(key: string, params?: Record<string, any>): string {
        let value = this.dictionary[this.currentLang()][key] || key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                value = value.replace(`{{${k}}}`, String(v));
            }
        }
        return value;
    }

    setLanguage(lang: Language) {
        this.currentLang.set(lang);
    }
}
