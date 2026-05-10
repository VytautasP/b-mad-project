import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSpinner } from './ui-spinner';
import { By } from '@angular/platform-browser';

describe('UiSpinner', () => {
  let fixture: ComponentFixture<UiSpinner>;
  let component: UiSpinner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(UiSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-spinner', () => {
    const spinner = fixture.debugElement.query(By.css('mat-spinner'));
    expect(spinner).toBeTruthy();
  });

  it('should not show message by default', () => {
    const message = fixture.debugElement.query(By.css('.spinner-message'));
    expect(message).toBeNull();
  });

  it('should show message when provided', () => {
    fixture.componentRef.setInput('message', 'Loading...');
    fixture.detectChanges();
    const message = fixture.debugElement.query(By.css('.spinner-message'));
    expect(message.nativeElement.textContent).toContain('Loading...');
  });

  it('should apply inline class when inline is true', () => {
    fixture.componentRef.setInput('inline', true);
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css('.spinner-container'));
    expect(container.classes['inline']).toBeTruthy();
  });

  it('should accept custom diameter input', () => {
    fixture.componentRef.setInput('diameter', 20);
    fixture.detectChanges();
    expect(component.diameter()).toBe(20);
  });
});
