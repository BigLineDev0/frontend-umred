import { Component, inject, signal } from '@angular/core';
import { AuthLayout } from "../../../Layout/auth-layout/auth-layout";
import { ButtonModule } from "primeng/button";
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';


@Component({
  imports: [AuthLayout, ReactiveFormsModule, InputText, ButtonModule, IconFieldModule, InputIconModule, PasswordModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);

  loading = signal(false);
  submitted = false;
  errorMessage = signal('');

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(8)]]
  });


  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }


  onSubmit() {

    this.submitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();

    console.log(credentials);
  }
}
