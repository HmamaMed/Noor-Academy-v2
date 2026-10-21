import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CourseService } from './course.service';
import { environment } from '../../../environments/environment';

describe('Course image request compatibility', () => {
  let service: CourseService;
  let http: HttpTestingController;
  const metadata = {
    title: 'Science',
    description: 'Learn together',
    syllabus: 'Discovery',
    price: 1234.5,
    totalSessions: 24,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourseService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('keeps existing JSON create/update requests when no cover changes', () => {
    service.create(metadata).subscribe();
    const create = http.expectOne(`${environment.apiUrl}/courses`);
    expect(create.request.body).toEqual(metadata);
    create.flush({ id: 1, ...metadata });
    service.update(1, metadata).subscribe();
    const update = http.expectOne(`${environment.apiUrl}/courses/1`);
    expect(update.request.body).toEqual(metadata);
    update.flush({ id: 1, ...metadata });
  });
  it('sends course metadata and an image in one multipart save', async () => {
    const image = new File(['PNG bytes'], 'cover.png', { type: 'image/png' });
    service.create(metadata, image).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/courses`);
    const data = request.request.body as FormData;
    expect(data).toBeInstanceOf(FormData);
    expect(data.get('image')).toBe(image);
    expect(JSON.parse(await (data.get('metadata') as Blob).text())).toEqual(metadata);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush({ id: 1, ...metadata });
  });
  it('removes an image only through an explicit multipart update', () => {
    service.update(1, metadata, null, true).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/courses/1`);
    const data = request.request.body as FormData;
    expect(data.get('removeImage')).toBe('true');
    expect(data.get('image')).toBeNull();
    request.flush({ id: 1, ...metadata, imageUrl: null });
  });
});
