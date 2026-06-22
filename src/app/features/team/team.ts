import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TeamsService, TeamSummary, TeamDetail, TeamDriver } from '../../core/services/teams.service';
import { TranslationService } from '../../core/services/translation.service';
import { DriverProfile } from '../../core/models/race-strategy.model';
import { API_BASE } from '../../core/api.config';
import { lastValueFrom } from 'rxjs';

type FormMode = 'closed' | 'add' | 'edit';

@Component({
    selector: 'app-team',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './team.html',
    styleUrl: './team.css'
})
export class TeamComponent implements OnInit {
    trans = inject(TranslationService);
    private teamsService = inject(TeamsService);
    private http = inject(HttpClient);

    teams = signal<TeamSummary[]>([]);
    selectedTeam = signal<TeamDetail | null>(null);
    loading = signal(false);
    error = signal<string | null>(null);

    showCreateForm = signal(false);
    newTeamName = '';

    formMode = signal<FormMode>('closed');
    editingId = signal<string | null>(null);
    lookingUp = signal(false);
    iracingId = '';
    autoFilled = false;

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

    trackById = (_: number, i: { id: string }) => i.id;
    trackByColor = (_: number, c: string) => c;
    trackByLicense = (_: number, l: any) => l;
    trackByRole = (_: number, r: any) => r;

    readonly colorPalette = [
        '#FFB000', '#2979FF', '#00E676', '#FF5252',
        '#D1C4E9', '#FF4081', '#00E5FF', '#FF6E40', '#7C4DFF', '#B2FF59'
    ];

    readonly licenseClasses: DriverProfile['licenseClass'][] = ['Pro', 'Pro/Am', 'A', 'B', 'C', 'D'];
    readonly roles: DriverProfile['role'][] = ['Primary', 'Reserve', 'Coach'];

    formLapTimeMs = () => {
        const m = Number(this.form.lapMin || 0);
        const s = Number(this.form.lapSec || 0);
        const ms = Number(this.form.lapMs || 0);
        return (m * 60 * 1000) + (s * 1000) + ms;
    };

    ngOnInit() {
        this.loadTeams();
    }

    async loadTeams() {
        this.loading.set(true);
        this.error.set(null);
        try {
            this.teams.set(await this.teamsService.loadTeams());
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to load teams');
        } finally {
            this.loading.set(false);
        }
    }

    async selectTeam(id: string) {
        this.loading.set(true);
        this.error.set(null);
        try {
            this.selectedTeam.set(await this.teamsService.loadTeam(id));
            this.closeForm();
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to load team');
        } finally {
            this.loading.set(false);
        }
    }

    closeTeam() {
        this.selectedTeam.set(null);
    }

    async createTeam() {
        if (!this.newTeamName.trim()) return;
        try {
            const team = await this.teamsService.createTeam(this.newTeamName.trim());
            this.teams.update(t => [team, ...t]);
            this.newTeamName = '';
            this.showCreateForm.set(false);
            await this.selectTeam(team.id);
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to create team');
        }
    }

    async deleteTeam(id: string, event: Event) {
        event.stopPropagation();
        if (!confirm('Delete this team and all its drivers?')) return;
        try {
            await this.teamsService.deleteTeam(id);
            this.teams.update(t => t.filter(x => x.id !== id));
            if (this.selectedTeam()?.id === id) this.selectedTeam.set(null);
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to delete team');
        }
    }

    async lookupDriver() {
        if (!this.iracingId) return;
        this.lookingUp.set(true);
        try {
            const driver = await lastValueFrom(
                this.http.get<{ displayName: string; licenseClass: string; iRating: number }>(`${API_BASE}/iracing/driver/${this.iracingId}`)
            );
            if (this.formMode() === 'add') {
                this.form.name = driver.displayName;
                this.form.licenseClass = driver.licenseClass as DriverProfile['licenseClass'];
                this.form.iRating = driver.iRating;
                this.autoFilled = true;
            }
        } catch { /* ignore */ }
        finally { this.lookingUp.set(false); }
    }

    openAdd() {
        this.resetForm();
        this.iracingId = '';
        this.autoFilled = false;
        this.editingId.set(null);
        this.formMode.set('add');
    }

    openEdit(driver: TeamDriver) {
        this.resetForm();
        this.form.name = driver.name;
        this.form.accentColor = driver.accentColor;
        this.form.licenseClass = (driver.licenseClass || 'A') as DriverProfile['licenseClass'];
        this.form.iRating = driver.iRating || null;
        this.form.nationality = driver.nationality || '';
        this.form.role = (driver.role || 'Primary') as DriverProfile['role'];
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
        this.iracingId = '';
        this.autoFilled = false;
    }

    async saveDriver() {
        if (!this.form.name.trim() || !this.selectedTeam()) return;
        const teamId = this.selectedTeam()!.id;
        const payload: any = {
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
        try {
            if (this.formMode() === 'edit' && this.editingId()) {
                const updated = await this.teamsService.updateDriver(teamId, this.editingId()!, payload);
                this.selectedTeam.update(t => t ? {
                    ...t, drivers: t.drivers.map(d => d.id === this.editingId() ? updated : d)
                } : t);
            } else {
                const created = await this.teamsService.addDriver(teamId, payload);
                this.selectedTeam.update(t => t ? { ...t, drivers: [...t.drivers, created] } : t);
            }
            this.closeForm();
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to save driver');
        }
    }

    async removeDriver(id: string) {
        if (!this.selectedTeam()) return;
        const teamId = this.selectedTeam()!.id;
        try {
            await this.teamsService.deleteDriver(teamId, id);
            this.selectedTeam.update(t => t ? { ...t, drivers: t.drivers.filter(d => d.id !== id) } : t);
            if (this.editingId() === id) this.closeForm();
        } catch (e: any) {
            this.error.set(e?.error?.error || 'Failed to remove driver');
        }
    }

    formatLapTime(ms: number): string {
        if (!ms) return '—';
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const msRem = ms % 1000;
        return `${m}:${s.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
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