import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, Subject } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: { login: any };
  let mockSnackBar: MatSnackBar & { open: any };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
      providers: [
        provideRouter([
          { path: 'tasks', component: LoginComponent },
          { path: 'register', component: LoginComponent },
        ]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginComponent);
    mockSnackBar = fixture.componentRef.injector.get(MatSnackBar) as MatSnackBar & { open: any };
    vi.spyOn(mockSnackBar, 'open').mockReturnValue(undefined as any);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Component creation ---
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Figma layout structure (AC 1, 2, 3, 4, 5) ---
  describe('Figma layout structure', () => {
    it('should render the top header with brand and sign-up prompt (AC 2)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const header = el.querySelector('.login-header');
      expect(header).toBeTruthy();
      expect(el.querySelector('.login-header__title')?.textContent).toContain('TaskFlow');
      expect(el.querySelector('.login-header__prompt')?.textContent).toContain(
        "Don't have an account?"
      );
      expect(el.querySelector('.login-header__signup-btn')?.textContent?.trim()).toBe('Sign Up');
    });

    it('should render the central login card with heading and subheading (AC 1, 3)', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.login-card')).toBeTruthy();
      expect(el.querySelector('.login-card__heading')?.textContent).toContain('Welcome back');
      expect(el.querySelector('.login-card__subheading')?.textContent).toContain(
        'Enter your credentials to access your workspace.'
      );
    });

    it('should render email and password fields with labels (AC 3)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const inputs = el.querySelectorAll('ui-text-input');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should render forgot password link (AC 3)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const link = el.querySelector('.login-field__forgot-link');
      expect(link).toBeTruthy();
      expect(link?.textContent).toContain('Forgot password?');
    });

    it('should render Sign In submit button (AC 3)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('.login-submit-btn');
      expect(btn).toBeTruthy();
      expect(btn?.textContent).toContain('Sign In');
    });

    it('should render social login section with divider and Google button (AC 4)', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.login-divider__text')?.textContent?.trim().toUpperCase()).toBe(
        'OR CONTINUE WITH'
      );
      const socialBtn = el.querySelector('.login-social-btn');
      expect(socialBtn).toBeTruthy();
      expect(socialBtn?.textContent).toContain('Google');
    });

    it('should render bottom legal strip with terms and privacy text (AC 5)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const legal = el.querySelector('.login-card__legal');
      expect(legal).toBeTruthy();
      expect(legal?.textContent).toContain('Terms of Service');
      expect(legal?.textContent).toContain('Privacy Policy');
    });
  });

  // --- Form validation (AC 6 - existing behaviour preserved) ---
  describe('form validation', () => {
    it('should initialise with an invalid form', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('should require email', () => {
      const email = component.loginForm.get('email');
      expect(email?.errors?.['required']).toBeTruthy();
    });

    it('should validate email format', () => {
      component.loginForm.get('email')?.setValue('bad');
      expect(component.loginForm.get('email')?.errors?.['email']).toBeTruthy();

      component.loginForm.get('email')?.setValue('good@example.com');
      expect(component.loginForm.get('email')?.errors).toBeNull();
    });

    it('should require password', () => {
      expect(component.loginForm.get('password')?.errors?.['required']).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('.login-submit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.setValue({ email: 'user@test.com', password: 'secret123' });
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.login-submit-btn') as HTMLButtonElement;
      expect(btn.disabled).toBeFalsy();
    });
  });

  // --- Login submission (AC 6) ---
  describe('login submission', () => {
    beforeEach(() => {
      component.loginForm.setValue({ email: 'user@test.com', password: 'pass123' });
    });

    it('should call authService.login with correct payload on submit', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'abc', userId: '1', email: 'user@test.com', name: 'User', expiresAt: '' }));
      component.onSubmit();
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'pass123',
      });
    });

    it('should navigate to tasks on successful login', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'abc', userId: '1', email: 'user@test.com', name: 'User', expiresAt: '' }));
      component.onSubmit();
      expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
    });

    it('should set isLoading false after successful login', () => {
      mockAuthService.login.mockReturnValue(of({ token: 'abc', userId: '1', email: 'user@test.com', name: 'User', expiresAt: '' }));
      expect(component.isLoading).toBe(false);
      component.onSubmit();
      expect(component.isLoading).toBe(false);
    });

    it('should show snackbar on 401 error', () => {
      const subject = new Subject<any>();
      mockAuthService.login.mockReturnValue(subject);
      component.onSubmit();
      subject.error({ status: 401 });
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Invalid credentials. Please check your email and password.',
        'Close',
        { duration: 5000 }
      );
    });

    it('should show snackbar on 400 error', () => {
      const subject = new Subject<any>();
      mockAuthService.login.mockReturnValue(subject);
      component.onSubmit();
      subject.error({ status: 400 });
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Invalid input. Please check your details.',
        'Close',
        { duration: 5000 }
      );
    });

    it('should show snackbar on 500 error', () => {
      const subject = new Subject<any>();
      mockAuthService.login.mockReturnValue(subject);
      component.onSubmit();
      subject.error({ status: 500 });
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Server error. Please try again later.',
        'Close',
        { duration: 5000 }
      );
    });

    it('should show generic error for other failures', () => {
      const subject = new Subject<any>();
      mockAuthService.login.mockReturnValue(subject);
      component.onSubmit();
      subject.error({ status: 0 });
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Login failed. Please try again.',
        'Close',
        { duration: 5000 }
      );
    });

    it('should not submit when form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.onSubmit();
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  // --- Accessibility baseline (AC 8) ---
  describe('accessibility', () => {
    it('should render mat-labels for inputs', () => {
      const el: HTMLElement = fixture.nativeElement;
      const labels = el.querySelectorAll('mat-label');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('should use semantic button roles', () => {
      const el: HTMLElement = fixture.nativeElement;
      const submitBtn = el.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
      const socialBtn = el.querySelector('button[type="button"]');
      expect(socialBtn).toBeTruthy();
    });

    it('should have aria-label on social button', () => {
      const el: HTMLElement = fixture.nativeElement;
      const socialBtn = el.querySelector('.login-social-btn');
      expect(socialBtn?.getAttribute('aria-label')).toBe('Sign in with Google');
    });

    it('should have validation errors on required fields when empty', () => {
      expect(component.loginForm.get('email')?.hasError('required')).toBe(true);
      expect(component.loginForm.get('password')?.hasError('required')).toBe(true);
    });
  });
});
