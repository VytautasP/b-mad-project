import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiErrorState } from './ui-error-state';
import { By } from '@angular/platform-browser';

describe('UiErrorState', () => {
  let fixture: ComponentFixture<UiErrorState>;
  let component: UiErrorState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiErrorState],
    }).compileComponents();

    fixture = TestBed.createComponent(UiErrorState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default heading', () => {
    const heading = fixture.debugElement.query(By.css('.error-heading'));
    expect(heading.nativeElement.textContent).toContain('Something went wrong');
  });

  it('should display custom heading', () => {
    fixture.componentRef.setInput('heading', 'Load failed');
    fixture.detectChanges();
    const heading = fixture.debugElement.query(By.css('.error-heading'));
    expect(heading.nativeElement.textContent).toContain('Load failed');
  });

  it('should show error_outline icon', () => {
    const icon = fixture.debugElement.query(By.css('.error-icon'));
    expect(icon.nativeElement.textContent.trim()).toBe('error_outline');
  });

  it('should not show description by default', () => {
    const desc = fixture.debugElement.query(By.css('.error-description'));
    expect(desc).toBeNull();
  });

  it('should show description when provided', () => {
    fixture.componentRef.setInput('description', 'Please try again later');
    fixture.detectChanges();
    const desc = fixture.debugElement.query(By.css('.error-description'));
    expect(desc.nativeElement.textContent).toContain('Please try again later');
  });

  it('should display default retry label', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Retry');
  });

  it('should emit retryClicked on button click', () => {
    let emitted = false;
    component.retryClicked.subscribe(() => emitted = true);
    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();
    expect(emitted).toBe(true);
  });

  it('should have role="alert"', () => {
    const container = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(container).toBeTruthy();
  });
});
