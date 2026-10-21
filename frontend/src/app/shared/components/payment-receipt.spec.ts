import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Enrollment } from '../../core/models/enrollment.model';
import { PaymentReceipt as Receipt, PaymentService } from '../../core/services/payment.service';
import { PaymentReceipt } from './payment-receipt';

describe('Private payment receipts', () => {
  const enrollment = {
    id: 12,
    status: 'PENDING',
    expiresAt: '2099-01-04T12:00:00Z',
  } as Enrollment;
  const receipt: Receipt = {
    enrollmentId: 12,
    fileName: 'receipt.pdf',
    fileSize: 12,
    uploadedAt: '2026-10-21T12:00:00Z',
  };
  let metadata: ReturnType<typeof vi.fn>;
  let upload: ReturnType<typeof vi.fn>;
  let response: Subject<Receipt>;

  beforeEach(() => {
    metadata = vi.fn(() => of(null));
    response = new Subject<Receipt>();
    upload = vi.fn(() => response);
    TestBed.configureTestingModule({
      imports: [PaymentReceipt],
      providers: [
        { provide: PaymentService, useValue: { receipt: metadata, uploadReceipt: upload } },
      ],
    });
  });
  function create(value = enrollment, allowUpload = true, uploadsEnabled = true) {
    const fixture = TestBed.createComponent(PaymentReceipt);
    fixture.componentRef.setInput('enrollment', value);
    fixture.componentRef.setInput('allowUpload', allowUpload);
    fixture.componentRef.setInput('uploadsEnabled', uploadsEnabled);
    fixture.detectChanges();
    return fixture;
  }
  function select(
    fixture: ReturnType<typeof create>,
    file = new File(['%PDF-receipt'], 'receipt.pdf', { type: 'application/pdf' }),
  ) {
    const input = fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return file;
  }
  it('requires an explicit send, prevents duplicate requests, and keeps the file after failure', () => {
    const fixture = create();
    const busy = vi.fn();
    fixture.componentInstance.busyChange.subscribe(busy);
    const file = select(fixture);
    expect(upload).not.toHaveBeenCalled();
    const send = fixture.nativeElement.querySelector('.receipt-send') as HTMLButtonElement;
    send.click();
    fixture.componentInstance['upload']();
    expect(upload).toHaveBeenCalledExactlyOnceWith(12, file);
    response.error({ error: { message: 'Please try again.' } });
    fixture.detectChanges();
    expect(fixture.componentInstance['selectedFile']()).toBe(file);
    expect(fixture.nativeElement.textContent).toContain('Please try again.');
    expect(busy.mock.calls.map((args) => args[0])).toEqual([true, false]);
  });
  it('shows uploaded proof while leaving the enrollment pending for admin verification', () => {
    const fixture = create();
    select(fixture);
    fixture.componentInstance['upload']();
    response.next(receipt);
    fixture.detectChanges();
    expect(fixture.componentInstance['selectedFile']()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Our team will verify the transfer');
    expect(fixture.nativeElement.textContent).toContain('Choose a replacement receipt');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Download payment receipt"]'),
    ).not.toBeNull();
    expect(enrollment.status).toBe('PENDING');
  });
  it('rejects unsupported and oversized files before uploading', () => {
    const fixture = create();
    select(fixture, new File(['fake'], 'receipt.html', { type: 'text/html' }));
    expect(fixture.nativeElement.textContent).toContain('Choose a PDF, JPG, or PNG');
    expect(fixture.componentInstance['selectedFile']()).toBeNull();
    select(
      fixture,
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' }),
    );
    fixture.componentInstance['upload']();
    expect(upload).not.toHaveBeenCalled();
  });
  it('allows retry after a metadata failure without presenting a misleading empty receipt', () => {
    metadata.mockReturnValue(throwError(() => new Error('Offline')));
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('We couldn’t check the receipt.');
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
    metadata.mockReturnValue(of(receipt));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(receipt.fileName);
  });
  it('keeps expired applications and admin review read-only', () => {
    const expired = create({ ...enrollment, expiresAt: '2020-01-01T00:00:00Z' });
    expect(expired.nativeElement.querySelector('input[type=file]')).toBeNull();
    expired.destroy();
    metadata.mockReturnValue(of(receipt));
    const admin = create(enrollment, false);
    expect(admin.nativeElement.querySelector('input[type=file]')).toBeNull();
    expect(
      admin.nativeElement.querySelector('[aria-label="Download payment receipt"]'),
    ).not.toBeNull();
  });
});
