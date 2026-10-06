import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { ClassWorkspace } from './workspace';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/notifications/toast.service';
import { Material, Workspace } from '../../core/models/material.model';

const workspace: Workspace = {
  canManage: true,
  uploadsEnabled: false,
  materials: [],
  group: {
    id: 4,
    courseId: 1,
    courseTitle: 'Course',
    groupName: 'Group',
    teacherId: 2,
    teacherName: 'Teacher',
    roomId: 1,
    roomName: 'Room',
    roomCapacity: 20,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    sessions: [],
    confirmedSeats: 1,
    remainingSeats: 19,
  },
};

describe('Class workspace API and editing boundaries', () => {
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let service: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
  };
  let auth: { hasRole: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ groupId: '4' }));
    service = { find: vi.fn(() => of(workspace)), create: vi.fn(), download: vi.fn() };
    auth = { hasRole: vi.fn((role: string) => role === 'TEACHER') };
    TestBed.configureTestingModule({
      imports: [ClassWorkspace],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: WorkspaceService, useValue: service },
        { provide: EnrollmentService, useValue: { findMine: vi.fn(() => of([])) } },
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: { error: vi.fn() } },
      ],
    }).overrideComponent(ClassWorkspace, { set: { template: '' } });
  });

  function create() {
    const fixture = TestBed.createComponent(ClassWorkspace);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('cancels an older route request and clears private data when the new route is denied', () => {
    const older = new Subject<Workspace>();
    service.find
      .mockReturnValueOnce(older)
      .mockReturnValueOnce(throwError(() => ({ status: 403 })));
    const component = create();
    params.next(convertToParamMap({ groupId: '5' }));
    older.next(workspace);
    expect(component['workspace']()).toBeNull();
    expect(component['denied']()).toBe(true);
    expect(component['loading']()).toBe(false);
  });

  it('cannot publish when the authorized workspace response grants read access only', () => {
    service.find.mockReturnValue(
      of({ ...workspace, canManage: false, group: { ...workspace.group, status: 'COMPLETED' } }),
    );
    const component = create();
    component['form'].patchValue({ title: 'Lesson', description: 'Private body' });
    component['publish']();
    expect(service.create).not.toHaveBeenCalled();
    expect(component['workspace']()?.group.status).toBe('COMPLETED');
  });

  it('retains entered text and the publishing form when the API rejects publication', () => {
    service.create.mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Please retry.' } })),
    );
    const component = create();
    component['openEditor']();
    component['form'].patchValue({ title: 'Lesson', description: 'Keep this unpublished text.' });
    component['publish']();
    expect(component['form'].getRawValue().description).toBe('Keep this unpublished text.');
    expect(component['editorOpen']()).toBe(true);
    expect(component['busy']()).toBe(false);
    expect(component['formError']()).toBe('Please retry.');
    expect(component['success']()).toBe('');
  });

  it('keeps unpublished changes when leaving is cancelled and clears them only after explicit discard', async () => {
    const component = create();
    component['openEditor']();
    component['form'].patchValue({ title: 'Unpublished lesson' });
    component['form'].markAsDirty();
    const keep = component.canLeave();
    component['resolveDiscard'](false);
    expect(await keep).toBe(false);
    expect(component['form'].getRawValue().title).toBe('Unpublished lesson');
    const discard = component.canLeave();
    component['resolveDiscard'](true);
    expect(await discard).toBe(true);
    expect(component['form'].getRawValue().title).toBe('');
  });
  it('keeps the resource available and identifies it for retry when a download fails', () => {
    const material: Material = {
      id: 11,
      groupId: 4,
      type: 'EXERCISE',
      title: 'Practice sheet',
      description: null,
      externalUrl: null,
      hasFile: true,
      fileName: 'practice.pdf',
      fileSize: 2048,
      authorName: 'Teacher',
      createdAt: '2026-10-06T10:00:00Z',
    };
    service.find.mockReturnValue(of({ ...workspace, materials: [material] }));
    service.download.mockReturnValue(throwError(() => ({ status: 503 })));
    const component = create();
    component['download'](material);
    expect(component['downloadError']()).toEqual(material);
    expect(component['downloading']()).toBeNull();
    expect(component['workspace']()?.materials).toEqual([material]);
  });
});
