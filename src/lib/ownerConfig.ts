export const OWNER_USER_ID = '7e38ac3e-43e1-470a-a189-88f12179d5c4';

export function isOwner(userId?: string | null): boolean {
  return !!userId && userId === OWNER_USER_ID;
}