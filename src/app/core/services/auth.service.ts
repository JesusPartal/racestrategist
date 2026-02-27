import { Injectable, signal } from '@angular/core';

export interface UserProfile {
    id: string;
    username: string;
    avatar?: string;
    license?: string;
    irating?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    currentUser = signal<UserProfile | null>(null);

    constructor() {
        this.checkAuth();
    }

    // Simulated iRacing OAuth2 Flow
    login() {
        // In a real app, this would redirect to iRacing OAuth2 endpoint
        // For this demo, we'll simulate a successful login
        const mockUser: UserProfile = {
            id: '123456',
            username: 'TrackTitan_99',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TrackTitan',
            license: 'Pro-A 4.99',
            irating: 4500
        };

        // Simulate a small delay for the login process
        setTimeout(() => {
            this.currentUser.set(mockUser);
            localStorage.setItem('rs_user', JSON.stringify(mockUser));
        }, 500);
    }

    logout() {
        this.currentUser.set(null);
        localStorage.removeItem('rs_user');
    }

    checkAuth() {
        const saved = localStorage.getItem('rs_user');
        if (saved) {
            try {
                this.currentUser.set(JSON.parse(saved));
            } catch (e) {
                localStorage.removeItem('rs_user');
            }
        }
    }
}
