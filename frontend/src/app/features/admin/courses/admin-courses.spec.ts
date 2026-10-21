import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { AdminCourses } from './admin-courses';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';

const course: Course = {
  id: 1,
  title: 'Science',
  description: 'Learn together',
  syllabus: 'Discovery',
  imageUrl: '/api/courses/1/image?v=old',
};
const settings = { uploadsEnabled: true, maxBytes: 5 * 1024 * 1024, maxDimension: 4096 };

describe('Course cover editing', () => {
  let service: {
    findAll: ReturnType<typeof vi.fn>;
    imageSettings: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn(() => 'blob:selected-cover');
        static override revokeObjectURL = vi.fn();
      },
    );
    service = {
      findAll: vi.fn(() => of([course])),
      imageSettings: vi.fn(() => of(settings)),
      create: vi.fn(),
      update: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AdminCourses],
      providers: [{ provide: CourseService, useValue: service }],
    }).overrideComponent(AdminCourses, { set: { template: '' } });
  });
  afterEach(() => vi.unstubAllGlobals());
  function create() {
    const fixture = TestBed.createComponent(AdminCourses);
    fixture.detectChanges();
    return fixture.componentInstance;
  }
  function select(
    component: AdminCourses,
    file = new File(['png'], 'cover.png', { type: 'image/png' }),
  ) {
    component.selectImage({ target: { files: [file], value: 'cover.png' } } as unknown as Event);
    return file;
  }
  it('keeps image and text for retry after a failed atomic save', () => {
    service.create.mockReturnValue(
      throwError(() => ({ error: { message: 'Storage unavailable.' } })),
    );
    const component = create();
    component.startCreate();
    component['form'].patchValue({ title: 'Science' });
    const image = select(component);
    component.submit();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Science' }),
      image,
    );
    expect(component['selectedImage']()).toBe(image);
    expect(component['editorOpen']()).toBe(true);
    expect(component['formError']()).toBe('Storage unavailable.');
    expect(component['saving']()).toBe(false);
  });
  it('marks cover-only changes as dirty and defers removal until save', () => {
    const pending = new Subject<Course>();
    service.update.mockReturnValue(pending);
    const component = create();
    component.startEdit(course);
    component.removeCurrentImage();
    expect(component['form'].dirty).toBe(true);
    expect(service.update).not.toHaveBeenCalled();
    component.submit();
    component.submit();
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: 'Science' }),
      null,
      true,
    );
    pending.next({ ...course, imageUrl: null });
    pending.complete();
    expect(component['editorOpen']()).toBe(false);
    expect(component['imageRemoved']()).toBe(false);
  });
  it('rejects oversized and unsupported files without submitting them', () => {
    const component = create();
    component.startCreate();
    select(component, new File(['<svg/>'], 'cover.svg', { type: 'image/svg+xml' }));
    expect(component['selectedImage']()).toBeNull();
    expect(component['imageError']()).toContain('JPEG or PNG');
    select(
      component,
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    );
    expect(component['selectedImage']()).toBeNull();
    expect(component['imageError']()).toContain('5 MB');
    expect(service.create).not.toHaveBeenCalled();
  });
  it('cannot select a file while storage is disabled but can save text', () => {
    service.imageSettings.mockReturnValue(of({ ...settings, uploadsEnabled: false }));
    service.create.mockReturnValue(of({ ...course, imageUrl: null }));
    const component = create();
    component.startCreate();
    component['form'].patchValue({ title: 'Science' });
    select(component);
    expect(component['selectedImage']()).toBeNull();
    component.submit();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Science' }),
      null,
    );
  });
  it('preserves an explicit free price and the session count when editing', () => {
    const component = create();
    component.startEdit({ ...course, price: 0, totalSessions: 12 });
    expect(component['form'].controls.price.value).toBe(0);
    expect(component['form'].controls.totalSessions.value).toBe(12);
    component.cancelEdit();
    expect(component['form'].controls.price.value).toBeNull();
    expect(component['form'].controls.totalSessions.value).toBeNull();
  });
  it('rejects negative prices, excessive precision, and fractional session counts before saving', () => {
    const component = create();
    component.startCreate();
    component['form'].controls.title.setValue('Science');
    for (const value of [
      { price: -1, totalSessions: 12 },
      { price: 12.345, totalSessions: 12 },
      { price: 200, totalSessions: 1.5 },
      { price: 200, totalSessions: 0 },
    ]) {
      component['form'].patchValue(value);
      component.submit();
      expect(service.create).not.toHaveBeenCalled();
    }
  });
  it('keeps the entered price and length after a failed save so the admin can retry', () => {
    service.create.mockReturnValue(throwError(() => ({ error: { message: 'Please retry.' } })));
    const component = create();
    component.startCreate();
    component['form'].patchValue({ title: 'Science', price: 1234.5, totalSessions: 24 });
    component.submit();
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ price: 1234.5, totalSessions: 24 }),
      null,
    );
    expect(component['form'].controls.price.value).toBe(1234.5);
    expect(component['form'].controls.totalSessions.value).toBe(24);
    expect(component['editorOpen']()).toBe(true);
  });
});
