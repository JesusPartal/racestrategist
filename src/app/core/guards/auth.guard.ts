import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.currentUser()) {
        return true;
    }

    // If not logged in and trying to access home, stay on landing (strategy)
    // But wait, the user said: "The landing page will be this if not logged in, or a new Home page if logged in"
    // So standard path is root. If authenticated -> Home, else -> Strategy.
    // Actually, standard routing would be:
    // / -> Root. Root component decides what to show.
    // OR
    // / -> Redirect to /home if authed, /strategy if not.

    return true; // We'll handle redirection in the app component or routes
};
