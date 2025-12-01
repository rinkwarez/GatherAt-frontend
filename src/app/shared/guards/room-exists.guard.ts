import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { RoomService } from '../../features/room/services/room.service';
import { ToastService } from '../services/toast.service';

/**
 * Guard to check if a room exists before allowing access to the room route
 * Shows error message if room doesn't exist
 */
export const roomExistsGuard: CanActivateFn = async (route) => {
  const roomService = inject(RoomService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const roomId = route.paramMap.get('roomId');

  if (!roomId) {
    toastService.error('Invalid or expired room ID');
    router.navigate(['/']);
    return false;
  }

  const exists = await roomService.roomExists(roomId);

  if (!exists) {
    toastService.error('Invalid or expired room ID');
    router.navigate(['/']);
    return false;
  }

  return true;
};
