import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommentFormComponent } from './comment-form.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('CommentFormComponent', () => {
  let component: CommentFormComponent;
  let fixture: ComponentFixture<CommentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentFormComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have content control with required validator', () => {
    expect(component.contentControl.hasError('required')).toBe(true);
  });

  it('should validate max length of 2000 chars', () => {
    const longText = 'a'.repeat(2001);
    component.contentControl.setValue(longText);
    expect(component.contentControl.hasError('maxlength')).toBe(true);
  });

  it('should have submit button disabled when empty', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button[mat-raised-button]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should have submit button disabled when isSubmitting is true', () => {
    component.isSubmitting = true;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector('button[mat-raised-button]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should emit submitComment on submit with content and mentionedUserIds', () => {
    const emitSpy = vi.spyOn(component.submitComment, 'emit');
    component.contentControl.setValue('Test comment');
    component.mentionedUsers = [{ id: 'user-2', name: 'Jane' }];

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      content: 'Test comment',
      mentionedUserIds: []
    });
  });

  it('should emit mentionedUserIds when mentions exist in content', () => {
    const emitSpy2 = vi.spyOn(component.submitComment, 'emit');
    component.contentControl.setValue('Hey @Jane check this');
    component.mentionedUsers = [{ id: 'user-2', name: 'Jane' }];

    component.onSubmit();

    expect(emitSpy2).toHaveBeenCalledWith({
      content: 'Hey @Jane check this',
      mentionedUserIds: ['user-2']
    });
  });

  it('should clear textarea after submit', () => {
    component.contentControl.setValue('Test comment');
    component.onSubmit();
    expect(component.contentControl.value).toBe('');
  });

  it('should show character count when over 1500 chars', () => {
    component.contentControl.setValue('a'.repeat(1501));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.char-count')).toBeTruthy();
  });

  it('should not show character count when under 1500 chars', () => {
    component.contentControl.setValue('short text');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.char-count')).toBeNull();
  });
});
