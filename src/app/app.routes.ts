import { Routes } from '@angular/router';
import { roomExistsGuard } from './shared/guards/room-exists.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'r/:roomId',
    loadComponent: () => import('./features/room/room.component').then((m) => m.RoomComponent),
    canActivate: [roomExistsGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
