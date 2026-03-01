import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/login-request.model';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    // Check for query params message (e.g., session expired)
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.snackBar.open(params['message'], 'Close', { duration: 5000 });
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid input. Please check your details.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }
}
