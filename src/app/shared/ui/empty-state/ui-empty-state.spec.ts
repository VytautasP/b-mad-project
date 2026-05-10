import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiEmptyState } from './ui-empty-state';
import { By } from '@angular/platform-browser';

describe('UiEmptyState', () => {
  let fixture: ComponentFixture<UiEmptyState>;
  let component: UiEmptyState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiEmptyState],
    }).compileComponents();

    fixture = TestBed.createComponent(UiEmptyState);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('heading', 'No items');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the heading', () => {
    const heading = fixture.debugElement.query(By.css('.empty-heading'));
    expect(heading.nativeElement.textContent).toContain('No items');
  });

  it('should use default icon of inbox', () => {
    const icon = fixture.debugElement.query(By.css('.empty-icon'));
    expect(icon.nativeElement.textContent.trim()).toBe('inbox');
  });

  it('should display custom icon', () => {
    fixture.componentRef.setInput('icon', 'filter_list_off');
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css('.empty-icon'));
    expect(icon.nativeElement.textContent.trim()).toBe('filter_list_off');
  });

  it('should not show description by default', () => {
    const desc = fixture.debugElement.query(By.css('.empty-description'));
    expect(desc).toBeNull();
  });

  it('should show description when provided', () => {
    fixture.componentRef.setInput('description', 'Create your first item');
    fixture.detectChanges();
    const desc = fixture.debugElement.query(By.css('.empty-description'));
    expect(desc.nativeElement.textContent).toContain('Create your first item');
  });

  it('should not show CTA button by default', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeNull();
  });

  it('should show CTA button and emit on click', () => {
    fixture.componentRef.setInput('ctaLabel', 'Create Task');
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Create Task');

    let emitted = false;
    component.ctaClicked.subscribe(() => emitted = true);
    button.nativeElement.click();
    expect(emitted).toBe(true);
  });
});
