import { Routes } from '@angular/router';
import { StrategyCalculator } from './features/strategy-calculator/strategy-calculator';
import { HomeComponent } from './features/home/home';
import { LoginComponent } from './features/login/login';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';
import { StrategiesListComponent } from './features/strategies-list/strategies-list';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { TeamComponent } from './features/team/team';

const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.currentUser() ? true : router.parseUrl('/login');
};

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
            const auth = inject(AuthService);
            return auth.currentUser() ? 'home' : 'login';
        }
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [() => {
            const auth = inject(AuthService);
            const router = inject(Router);
            return auth.currentUser() ? router.parseUrl('/home') : true;
        }]
    },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'strategies', component: StrategiesListComponent, canActivate: [authGuard] },
    { path: 'team', component: TeamComponent, canActivate: [authGuard] },
    {
        path: 'strategy',
        component: StrategyCalculator,
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard]
    }
];
