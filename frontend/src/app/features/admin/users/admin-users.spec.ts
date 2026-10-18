import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminUsers } from './admin-users';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

const owner: User = {
  id: 1,
  firstName: 'Owner',
  lastName: 'Account',
  email: 'owner@example.test',
  phone: null,
  role: 'SUPER_ADMIN',
};

describe('Protected administrator presentation', () => {
  let service: { findAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    service = { findAll: vi.fn(() => of([owner])), delete: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AdminUsers],
      providers: [{ provide: UserService, useValue: service }],
    });
  });
  it('shows the ordinary admin label and disables the protected delete action', () => {
    const fixture = TestBed.createComponent(AdminUsers);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.status-badge')?.textContent?.trim()).toBe('Admin');
    expect(element.textContent).not.toContain('SUPER_ADMIN');
    expect(
      (element.querySelector('button[aria-label="Delete Owner Account"]') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fixture.componentInstance.requestDelete(owner);
    fixture.componentInstance.deleteRecord();
    expect(service.delete).not.toHaveBeenCalled();
  });
});
