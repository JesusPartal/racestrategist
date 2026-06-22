import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from '../../core/services/translation.service';
import { API_BASE } from '../../core/api.config';
import { lastValueFrom } from 'rxjs';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  licenseClass: string;
  iRating: number;
  teamId: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <h2 class="page-title">{{ trans.translate('admin_title') }}</h2>

      <!-- Add User Form -->
      <div class="glass-card" style="padding: 25px; margin-bottom: 30px;">
        <h3 style="font-family: var(--font-display); font-size: 0.9rem; margin: 0 0 20px;">{{ trans.translate('admin_add_user') }}</h3>
        <div class="add-form">
          <input type="text" [(ngModel)]="newIracingId" placeholder="iRacing ID" class="admin-input" style="max-width: 120px;">
          <button class="btn-lookup" (click)="lookupIracing()" [disabled]="!newIracingId || lookingUp()">
            <i class="fa-solid fa-search"></i> {{ trans.translate('lookup') }}
          </button>
          <input type="text" [(ngModel)]="newUsername" placeholder="Username" class="admin-input">
          <input type="password" [(ngModel)]="newPassword" placeholder="Password" class="admin-input">
          <input type="text" [(ngModel)]="newDisplayName" placeholder="Display name" class="admin-input" [readonly]="autoFilled">
          <button class="btn-add" (click)="addUser()" [disabled]="saving()">
            <i class="fa-solid fa-plus"></i> {{ trans.translate('admin_add') }}
          </button>
        </div>
        <div class="auto-info" *ngIf="autoFilled">
          <span>{{ trans.translate('admin_auto_license') }}: <strong>{{ newLicenseClass }}</strong></span>
          <span>{{ trans.translate('admin_auto_irating') }}: <strong>{{ newIRating }}</strong></span>
        </div>
        <div class="error-msg" *ngIf="error()">{{ error() }}</div>
        <div class="success-msg" *ngIf="success()">{{ success() }}</div>
      </div>

      <!-- User List -->
      <div class="glass-card" style="padding: 25px;">
        <h3 style="font-family: var(--font-display); font-size: 0.9rem; margin: 0 0 20px;">{{ trans.translate('admin_user_list') }} ({{ users().length }})</h3>
        <div class="user-table">
          <div class="table-header">
            <span>Username</span>
            <span>Display Name</span>
            <span>License</span>
            <span>iRating</span>
            <span>Team</span>
            <span>Admin</span>
            <span></span>
          </div>
          <div class="table-row" *ngFor="let u of users()">
            <span>{{ u.username }}</span>
            <span>{{ u.displayName }}</span>
            <span>{{ u.licenseClass }}</span>
            <span>{{ u.iRating }}</span>
            <span>{{ u.teamId }}</span>
            <span>{{ u.isAdmin ? '\u2713' : '' }}</span>
            <span class="row-actions">
              <button class="btn-edit" (click)="openEdit(u)" title="Edit user">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-delete" (click)="deleteUser(u)" *ngIf="!u.isAdmin" title="Delete user">
                <i class="fa-solid fa-trash"></i>
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="delete-overlay" *ngIf="editTarget()" (click)="closeEdit()">
      <div class="delete-modal glass-card animate-in" (click)="$event.stopPropagation()">
        <div class="delete-icon">
          <i class="fa-solid fa-user-pen"></i>
        </div>
        <h3 class="delete-title">{{ trans.translate('admin_edit_title') }}: {{ editTarget()?.username }}</h3>
        <div class="edit-fields">
          <div class="edit-field" style="display: flex; gap: 8px; align-items: flex-end;">
            <div style="flex: 1;">
              <label>{{ trans.translate('admin_iracing_id') }}</label>
              <input type="text" [(ngModel)]="editIracingId" placeholder="iRacing ID" class="admin-input">
            </div>
            <button class="btn-lookup-sm" (click)="lookupEditIracing()" [disabled]="!editIracingId || editLookingUp()">
              <i class="fa-solid fa-search"></i> {{ trans.translate('lookup') }}
            </button>
          </div>
          <div class="edit-field">
            <label>{{ trans.translate('admin_display_name') }}</label>
            <input type="text" [(ngModel)]="editDisplayName" class="admin-input">
          </div>
          <div class="edit-field">
            <label>{{ trans.translate('admin_license_class') }}</label>
            <input type="text" [(ngModel)]="editLicenseClass" class="admin-input">
          </div>
          <div class="edit-field" style="display: flex; gap: 12px;">
            <div style="flex: 1;">
              <label>{{ trans.translate('admin_irating') }}</label>
              <input type="number" [(ngModel)]="editIRating" class="admin-input">
            </div>
            <div style="flex: 1;">
              <label>{{ trans.translate('admin_team_id') }}</label>
              <input type="text" [(ngModel)]="editTeamId" class="admin-input">
            </div>
          </div>
          <div class="edit-field">
            <label>{{ trans.translate('admin_new_password') }}</label>
            <input type="password" [(ngModel)]="editPassword" placeholder="{{ trans.translate('admin_password_placeholder') }}" class="admin-input">
          </div>
        </div>
        <div class="delete-actions">
          <button class="btn-delete-confirm" (click)="saveEdit()" [disabled]="saving()">
            <i class="fa-solid fa-floppy-disk"></i> {{ trans.translate('save') }}
          </button>
          <button class="btn-delete-cancel" (click)="closeEdit()">{{ trans.translate('cancel') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; margin: 0 auto; }
    .page-title { font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 25px; }
    .add-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
    .admin-input { flex: 1; min-width: 140px; width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; font-size: 0.85rem; box-sizing: border-box; }
    .admin-input:focus { outline: none; border-color: var(--accent-color); }
    .admin-input::placeholder { color: rgba(255,255,255,0.25); }
    .btn-add { display: flex; align-items: center; gap: 6px; background: var(--accent-color); color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-add:hover:not(:disabled) { background: #ffc926; }
    .btn-add:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-lookup { display: flex; align-items: center; gap: 6px; background: rgba(255,176,0,0.15); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 10px 16px; border-radius: 6px; font-weight: 700; font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-lookup:hover:not(:disabled) { background: rgba(255,176,0,0.25); }
    .btn-lookup:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-lookup-sm { display: flex; align-items: center; gap: 4px; background: rgba(255,176,0,0.15); border: 1px solid var(--accent-color); color: var(--accent-color); padding: 10px 12px; border-radius: 6px; font-weight: 700; font-family: var(--font-display); font-size: 0.65rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-lookup-sm:hover:not(:disabled) { background: rgba(255,176,0,0.25); }
    .btn-lookup-sm:disabled { opacity: 0.4; cursor: not-allowed; }
    .auto-info { display: flex; gap: 20px; margin-top: 10px; font-size: 0.75rem; color: var(--text-dim); }
    .auto-info strong { color: #fff; }
    .btn-edit { background: transparent; border: 1px solid rgba(255,176,0,0.3); color: var(--accent-color); padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
    .btn-edit:hover { background: rgba(255,176,0,0.15); border-color: var(--accent-color); }
    .btn-delete { background: transparent; border: 1px solid rgba(255,82,82,0.3); color: #ff5252; padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: 0.2s; font-size: 0.8rem; }
    .btn-delete:hover { background: rgba(255,82,82,0.15); border-color: #ff5252; }
    .row-actions { display: flex; gap: 6px; }
    .user-table { display: flex; flex-direction: column; gap: 2px; }
    .table-header, .table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 0.8fr 0.8fr 1fr 0.5fr 1fr; gap: 10px; padding: 10px 12px; align-items: center; font-size: 0.8rem; }
    .table-header { color: var(--text-dim); font-size: 0.6rem; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .table-row { border-radius: 4px; transition: 0.15s; }
    .table-row:hover { background: rgba(255,255,255,0.03); }
    .error-msg { color: #ff5252; font-size: 0.75rem; margin-top: 10px; padding: 8px; background: rgba(255,82,82,0.1); border-radius: 6px; }
    .success-msg { color: #4caf50; font-size: 0.75rem; margin-top: 10px; padding: 8px; background: rgba(76,175,80,0.1); border-radius: 6px; }
    .edit-fields { display: flex; flex-direction: column; gap: 14px; margin: 18px 0; }
    .edit-field label { display: block; font-size: 0.6rem; color: var(--text-dim); letter-spacing: 1.5px; margin-bottom: 4px; }
    .delete-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .delete-modal { max-width: 420px; width: 90%; padding: 35px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
    .delete-icon { font-size: 2rem; margin-bottom: 10px; color: var(--accent-color); }
    .delete-title { font-family: var(--font-display); font-size: 1rem; margin: 0 0 5px; }
    .delete-actions { display: flex; gap: 12px; justify-content: center; margin-top: 20px; }
    .btn-delete-confirm { display: flex; align-items: center; gap: 6px; background: var(--accent-color); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; }
    .btn-delete-confirm:hover:not(:disabled) { background: #ffc926; }
    .btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-delete-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 12px 24px; border-radius: 6px; font-family: var(--font-display); font-weight: 700; font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; }
    .btn-delete-cancel:hover { border-color: var(--accent-color); color: var(--accent-color); }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  trans = inject(TranslationService);

  users = signal<AdminUser[]>([]);
  newUsername = '';
  newPassword = '';
  newDisplayName = '';
  newIracingId = '';
  newLicenseClass = '';
  newIRating = 0;
  lookingUp = signal(false);
  autoFilled = false;
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  editTarget = signal<AdminUser | null>(null);
  editDisplayName = '';
  editLicenseClass = '';
  editIRating = 0;
  editTeamId = '';
  editPassword = '';
  editIracingId = '';
  editLookingUp = signal(false);

  async ngOnInit() {
    await this.loadUsers();
  }

  private async loadUsers() {
    try {
      const list = await lastValueFrom(this.http.get<AdminUser[]>(`${API_BASE}/admin/users`));
      this.users.set(list);
    } catch {
      this.error.set('Failed to load users');
    }
  }

  async lookupIracing() {
    if (!this.newIracingId) return;
    this.lookingUp.set(true);
    this.error.set(null);
    this.autoFilled = false;
    try {
      const driver = await lastValueFrom(
        this.http.get<{ displayName: string; licenseClass: string; iRating: number }>(`${API_BASE}/iracing/driver/${this.newIracingId}`)
      );
      this.newDisplayName = driver.displayName;
      this.newLicenseClass = driver.licenseClass;
      this.newIRating = driver.iRating;
      this.autoFilled = true;
      if (!this.newUsername) {
        this.newUsername = this.newIracingId;
      }
    } catch {
      this.error.set('Could not find driver with that iRacing ID');
    } finally {
      this.lookingUp.set(false);
    }
  }

  async addUser() {
    if (!this.newUsername || !this.newPassword) {
      this.error.set('Username and password are required');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await lastValueFrom(this.http.post(`${API_BASE}/admin/users`, {
        username: this.newUsername,
        password: this.newPassword,
        displayName: this.newDisplayName || this.newUsername,
        licenseClass: this.autoFilled ? this.newLicenseClass : undefined,
        iRating: this.autoFilled ? this.newIRating : undefined,
      }));
      this.newUsername = '';
      this.newPassword = '';
      this.newDisplayName = '';
      this.newIracingId = '';
      this.newLicenseClass = '';
      this.newIRating = 0;
      this.autoFilled = false;
      this.success.set('User created successfully');
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.error || 'Failed to create user');
    } finally {
      this.saving.set(false);
    }
  }

  openEdit(user: AdminUser) {
    this.editTarget.set(user);
    this.editDisplayName = user.displayName;
    this.editLicenseClass = user.licenseClass;
    this.editIRating = user.iRating;
    this.editTeamId = user.teamId;
    this.editPassword = '';
    this.error.set(null);
    this.success.set(null);
  }

  closeEdit() {
    this.editTarget.set(null);
    this.editIracingId = '';
  }

  async lookupEditIracing() {
    if (!this.editIracingId) return;
    this.editLookingUp.set(true);
    this.error.set(null);
    try {
      const driver = await lastValueFrom(
        this.http.get<{ displayName: string; licenseClass: string; iRating: number }>(`${API_BASE}/iracing/driver/${this.editIracingId}`)
      );
      this.editDisplayName = driver.displayName;
      this.editLicenseClass = driver.licenseClass;
      this.editIRating = driver.iRating;
    } catch {
      this.error.set('Could not find driver with that iRacing ID');
    } finally {
      this.editLookingUp.set(false);
    }
  }

  async saveEdit() {
    const target = this.editTarget();
    if (!target) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(this.http.put(`${API_BASE}/admin/users/${target.id}`, {
        displayName: this.editDisplayName,
        licenseClass: this.editLicenseClass,
        iRating: this.editIRating,
        teamId: this.editTeamId,
        password: this.editPassword || undefined,
      }));
      this.closeEdit();
      this.success.set('User updated successfully');
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.error || 'Failed to update user');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteUser(user: AdminUser) {
    if (!confirm(`Delete user "${user.username}"?`)) return;
    try {
      await lastValueFrom(this.http.delete(`${API_BASE}/admin/users/${user.id}`));
      await this.loadUsers();
    } catch {
      this.error.set('Failed to delete user');
    }
  }
}
