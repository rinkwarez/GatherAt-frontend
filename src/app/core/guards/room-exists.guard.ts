import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { RoomService } from '../../features/room/services/room.service';

/**
 * Guard to check if a room exists before allowing access to the room route
 * Redirects to home page if room doesn't exist
 */
export const roomExistsGuard: CanActivateFn = async (route) => {
  const roomService = inject(RoomService);
  const router = inject(Router);

  const roomId = route.paramMap.get('roomId');

  if (!roomId) {
    router.navigate(['/']);
    return false;
  }

  const exists = await roomService.roomExists(roomId);

  if (!exists) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
