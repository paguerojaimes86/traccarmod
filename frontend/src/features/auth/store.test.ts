import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@features/auth/store';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('sets session with user', () => {
    const user = { id: 1, name: 'Test', email: 'test@test.com' };
    useAuthStore.getState().setSession(user);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('sets session with token', () => {
    const user = { id: 1, name: 'Test', email: 'test@test.com' };
    useAuthStore.getState().setSession(user, 'my-token');

    const state = useAuthStore.getState();
    expect(state.token).toBe('my-token');
  });

  it('clears state on logout', () => {
    useAuthStore.getState().setSession({ id: 1, name: 'Test', email: 'test@test.com' }, 'token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('updates token independently', () => {
    useAuthStore.getState().setToken('new-token');
    expect(useAuthStore.getState().token).toBe('new-token');
  });
});
