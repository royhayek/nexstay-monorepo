import type { UserDataDto } from 'src/api/models';

export type AuthState = {
  user: UserDataDto | null;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserDataDto | null;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};
