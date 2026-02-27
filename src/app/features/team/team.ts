import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../core/services/team.service';
import { DriverProfile } from '../../core/models/race-strategy.model';

type FormMode = 'closed' | 'add' | 'edit';

@Component({
    selector: 'app-team',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './team.html',
    styleUrl: './team.css'
})
export class TeamComponent {
    team = inject(TeamService);

    primaryDriverCount = computed(() =>
        this.team.roster().filter(d => (d.role || 'Primary') === 'Primary').length
    );

    // ── Form State ──────────────────────────────────────────────────────────
    formMode = signal<FormMode>('closed');
    editingId = signal<string | null>(null);

    // Form fields
    form = {
        name: '',
        accentColor: '#FFB000',
        licenseClass: 'A' as DriverProfile['licenseClass'],
        iRating: null as number | null,
        nationality: '',
        role: 'Primary' as DriverProfile['role'],
        lapMin: null as number | null,
        lapSec: null as number | null,
        lapMs: null as number | null,
        fuelPerLapL: null as number | null,
        errorFactor: 0.02
    };

    readonly colorPalette = [
        '#FFB000', '#2979FF', '#00E676', '#FF5252',
        '#D1C4E9', '#FF4081', '#00E5FF', '#FF6E40', '#7C4DFF', '#B2FF59'
    ];

    readonly licenseClasses: DriverProfile['licenseClass'][] = ['Pro', 'Pro/Am', 'A', 'B', 'C', 'D'];
    readonly roles: DriverProfile['role'][] = ['Primary', 'Reserve', 'Coach'];

    formLapTimeMs = computed(() => {
        const m = Number(this.form.lapMin || 0);
        const s = Number(this.form.lapSec || 0);
        const ms = Number(this.form.lapMs || 0);
        return (m * 60 * 1000) + (s * 1000) + ms;
    });

    // ── Driver actions ──────────────────────────────────────────────────────
    openAdd() {
        this.resetForm();
        const nextColor = this.colorPalette[this.team.roster().length % this.colorPalette.length];
        this.form.accentColor = nextColor;
        this.editingId.set(null);
        this.formMode.set('add');
    }

    openEdit(driver: DriverProfile) {
        this.resetForm();
        this.form.name = driver.name;
        this.form.accentColor = driver.accentColor;
        this.form.licenseClass = driver.licenseClass || 'A';
        this.form.iRating = driver.iRating || null;
        this.form.nationality = driver.nationality || '';
        this.form.role = driver.role || 'Primary';
        this.form.fuelPerLapL = driver.fuelPerLapL || null;
        this.form.errorFactor = driver.errorFactor;

        if (driver.avgLapTimeMs) {
            const totalSec = Math.floor(driver.avgLapTimeMs / 1000);
            this.form.lapMin = Math.floor(totalSec / 60);
            this.form.lapSec = totalSec % 60;
            this.form.lapMs = driver.avgLapTimeMs % 1000;
        }

        this.editingId.set(driver.id);
        this.formMode.set('edit');
    }

    closeForm() {
        this.formMode.set('closed');
        this.editingId.set(null);
        this.resetForm();
    }

    saveDriver() {
        if (!this.form.name.trim()) return;

        const payload: Omit<DriverProfile, 'id'> = {
            name: this.form.name.trim(),
            accentColor: this.form.accentColor,
            avgLapTimeMs: this.formLapTimeMs(),
            fuelPerLapL: this.form.fuelPerLapL || undefined,
            errorFactor: this.form.errorFactor,
            licenseClass: this.form.licenseClass,
            iRating: this.form.iRating || undefined,
            nationality: this.form.nationality || undefined,
            role: this.form.role
        };

        if (this.formMode() === 'edit' && this.editingId()) {
            this.team.updateDriver(this.editingId()!, payload);
        } else {
            this.team.addDriver(payload);
        }
        this.closeForm();
    }

    removeDriver(id: string) {
        this.team.removeDriver(id);
        if (this.editingId() === id) this.closeForm();
    }

    getLicenseBadgeColor(cls?: string): string {
        const map: Record<string, string> = {
            'Pro': '#FFB000', 'Pro/Am': '#FF6E40',
            'A': '#00E676', 'B': '#2979FF', 'C': '#FF5252', 'D': '#888'
        };
        return map[cls || ''] || '#555';
    }

    private resetForm() {
        this.form = {
            name: '', accentColor: '#FFB000',
            licenseClass: 'A', iRating: null, nationality: '',
            role: 'Primary', lapMin: null, lapSec: null, lapMs: null,
            fuelPerLapL: null, errorFactor: 0.02
        };
    }
}
