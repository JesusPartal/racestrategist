import { Routes } from '@angular/router';
import { StrategyCalculator } from './features/strategy-calculator/strategy-calculator';
import { HomeComponent } from './features/home/home';
import { LoginComponent } from './features/login/login';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

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
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [() => {
            const auth = inject(AuthService);
            const router = inject(Router);
            return auth.currentUser() ? true : router.parseUrl('/login');
        }]
    },
    {
        path: 'strategy',
        component: StrategyCalculator,
        canActivate: [() => {
            const auth = inject(AuthService);
            const router = inject(Router);
            return auth.currentUser() ? true : router.parseUrl('/login');
        }]
    }
];
