import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WorkspaceService } from './workspace.service';
import { environment } from '../../../environments/environment';
import { jwtInterceptor } from '../auth/jwt.interceptor';
import { AuthService } from '../auth/auth.service';
import { provideRouter } from '@angular/router';

describe('Private attachment downloads', () => {
  let service: WorkspaceService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/workspaces/4/materials/11`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: 'private-jwt', logout: vi.fn() } },
      ],
    });
    service = TestBed.inject(WorkspaceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests an authorized R2 link without fetching attachment bytes through Angular', () => {
    const received = vi.fn();
    service.download(4, 11).subscribe(received);
    const request = http.expectOne(`${base}/download`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer private-jwt');
    request.flush({ url: 'https://account.r2.cloudflarestorage.com/private?signature=test', expiresAt: '2026-10-18T12:05:00Z' });
    expect(received).toHaveBeenCalledWith({ url: 'https://account.r2.cloudflarestorage.com/private?signature=test', expiresAt: '2026-10-18T12:05:00Z' });
    http.expectNone(`${base}/file`);
  });

  it('does not attempt a file request when the API refuses access', () => {
    const rejected = vi.fn();
    service.download(4, 11).subscribe({ error: rejected });
    http.expectOne(`${base}/download`).flush({ message: 'Access denied' }, { status: 403, statusText: 'Forbidden' });
    expect(rejected).toHaveBeenCalled();
    http.expectNone(`${base}/file`);
  });
});
