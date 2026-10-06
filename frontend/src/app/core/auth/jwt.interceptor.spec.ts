import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
describe('JWT interceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  beforeEach(() => {
    localStorage.setItem('noor_academy_token', 'test-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    requests.verify();
    localStorage.clear();
  });
  it('sends the JWT only to the academy API', () => {
    http.get(`${environment.apiUrl}/users/me`).subscribe();
    const api = requests.expectOne(`${environment.apiUrl}/users/me`);
    expect(api.request.headers.get('Authorization')).toBe('Bearer test-token');
    api.flush({});
    http.get('https://drive.google.com/example').subscribe();
    const other = requests.expectOne('https://drive.google.com/example');
    expect(other.request.headers.has('Authorization')).toBe(false);
    other.flush({});
    http.get(`${environment.apiUrl}-other/users`).subscribe();
    const prefix = requests.expectOne(`${environment.apiUrl}-other/users`);
    expect(prefix.request.headers.has('Authorization')).toBe(false);
    prefix.flush({});
  });
  it('clears an invalid session and redirects after an API 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http.get(`${environment.apiUrl}/users/me`).subscribe({ error: () => {} });
    requests
      .expectOne(`${environment.apiUrl}/users/me`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(AuthService).token).toBeNull();
    expect(navigate).toHaveBeenCalled();
  });
});
