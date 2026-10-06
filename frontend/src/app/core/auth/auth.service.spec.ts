import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
const token = (expiry: number) => `header.${btoa(JSON.stringify({ exp: expiry }))}.signature`;
describe('AuthService session validation', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });
  afterEach(() => localStorage.clear());
  it('rejects expired and malformed tokens', () => {
    localStorage.setItem('noor_academy_token', token(Date.now() / 1000 - 60));
    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated).toBe(false);
    localStorage.setItem('noor_academy_token', 'broken');
    expect(auth.isAuthenticated).toBe(false);
  });
  it('loads a valid session and survives corrupt stored profile data', () => {
    localStorage.setItem('noor_academy_token', token(Date.now() / 1000 + 3600));
    localStorage.setItem('noor_academy_user', '{bad json');
    const auth = TestBed.inject(AuthService);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.currentUser).toBeNull();
    auth.logout();
    expect(auth.isAuthenticated).toBe(false);
  });
  it('does not restore a user with an expired token', () => {
    localStorage.setItem('noor_academy_token', token(Date.now() / 1000 - 60));
    localStorage.setItem('noor_academy_user', JSON.stringify({ id: 1, role: 'ADMIN' }));
    expect(TestBed.inject(AuthService).currentUser).toBeNull();
  });
});
