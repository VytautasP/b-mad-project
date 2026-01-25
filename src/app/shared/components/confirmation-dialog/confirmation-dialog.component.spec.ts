import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let mockDialogRef: { close: any };
  let dialogData: ConfirmationDialogData;

  beforeEach(async () => {
    dialogData = {
      title: 'Test Title',
      message: 'Test Message',
      confirmText: 'Yes',
      cancelText: 'No'
    };

    mockDialogRef = {
      close: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message from dialog data', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Title');
    expect(compiled.querySelector('p')?.textContent).toContain('Test Message');
  });

  it('should display custom button text when provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons[0].textContent?.trim()).toBe('No');
    expect(buttons[1].textContent?.trim()).toBe('Yes');
  });

  it('should display default button text when not provided', () => {
    dialogData.confirmText = undefined;
    dialogData.cancelText = undefined;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    expect(buttons[0].textContent?.trim()).toBe('Cancel');
    expect(buttons[1].textContent?.trim()).toBe('Confirm');
  });

  it('should close dialog with true when confirm is clicked', () => {
    component.onConfirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with false when cancel is clicked', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
