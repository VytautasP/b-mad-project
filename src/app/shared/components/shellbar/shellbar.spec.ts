import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShellbarComponent } from './shellbar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ShellbarComponent', () => {
  let component: ShellbarComponent;
  let fixture: ComponentFixture<ShellbarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    id: '1',
    email: 'sarah@example.com',
    name: 'Sarah Connor'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUserSubject.asObservable()
    });
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ShellbarComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShellbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header with banner role', () => {
    const header = fixture.nativeElement.querySelector('header[role="banner"]');
    expect(header).toBeTruthy();
    expect(header.getAttribute('aria-label')).toBe('Application header');
  });

  it('should render brand logo and name', () => {
    const brandLogo = fixture.nativeElement.querySelector('.brand-logo');
    expect(brandLogo).toBeTruthy();

    const brandName = fixture.nativeElement.querySelector('.brand-name');
    expect(brandName).toBeTruthy();
    expect(brandName.textContent.trim()).toBe('TaskFlow');
  });

  it('should render search input with placeholder', () => {
    const searchInput = fixture.nativeElement.querySelector('.search-input');
    expect(searchInput).toBeTruthy();
    expect(searchInput.getAttribute('placeholder')).toBe('Search tasks, projects, people...');
    expect(searchInput.getAttribute('aria-label')).toBe('Search tasks, projects, and people');
  });

  it('should emit search value on input', () => {
    spyOn(component.searchOutput, 'emit');
    const searchInput = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    searchInput.value = 'test query';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.searchValue()).toBe('test query');
    expect(component.searchOutput.emit).toHaveBeenCalledWith('test query');
  });

  it('should render Create Task button with aria-label', () => {
    const createBtn = fixture.nativeElement.querySelector('.create-task-btn');
    expect(createBtn).toBeTruthy();
    expect(createBtn.getAttribute('aria-label')).toBe('Create new task');
    expect(createBtn.textContent).toContain('Create Task');
  });

  it('should open task form dialog when Create Task is clicked', () => {
    mockDialog.open.and.returnValue({ componentInstance: { mode: '' }, afterClosed: () => of(null) } as any);
    component.onCreateTask();
    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should render notification bell button with aria-label', () => {
    const bellBtn = fixture.nativeElement.querySelector('.bell-btn');
    expect(bellBtn).toBeTruthy();
    expect(bellBtn.getAttribute('aria-label')).toBe('Notifications');
  });

  it('should render vertical divider', () => {
    const divider = fixture.nativeElement.querySelector('.vertical-divider');
    expect(divider).toBeTruthy();
  });

  it('should render user profile section when user is logged in', () => {
    const profileContainer = fixture.nativeElement.querySelector('.profile-container');
    expect(profileContainer).toBeTruthy();

    const profileName = fixture.nativeElement.querySelector('.profile-name');
    expect(profileName.textContent.trim()).toBe('Sarah Connor');
  });

  it('should show avatar fallback when no profile image', () => {
    const fallback = fixture.nativeElement.querySelector('.profile-avatar-fallback');
    expect(fallback).toBeTruthy();
  });

  it('should show avatar image when profile image URL exists', () => {
    currentUserSubject.next({ ...mockUser, profileImageUrl: 'https://example.com/avatar.png' });
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.profile-avatar');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png');
  });

  it('should have profile dropdown with aria-haspopup', () => {
    const profileBtn = fixture.nativeElement.querySelector('.profile-container');
    expect(profileBtn.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('should call AuthService.logout when logout is clicked', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should update profileMenuOpen signal on menu open/close', () => {
    expect(component.profileMenuOpen()).toBeFalse();
    component.onProfileMenuOpened();
    expect(component.profileMenuOpen()).toBeTrue();
    component.onProfileMenuClosed();
    expect(component.profileMenuOpen()).toBeFalse();
  });

  it('should have 64px height shellbar', () => {
    const shellbar = fixture.nativeElement.querySelector('.shellbar');
    const styles = getComputedStyle(shellbar);
    expect(styles.height).toBe('64px');
  });
});