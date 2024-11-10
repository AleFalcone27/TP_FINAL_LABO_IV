import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  constructor(private router: Router) {}

  navigateToEspecialista() {
    this.router.navigate(['/registerespecialista']);
  }

  navigateToPaciente() {
    this.router.navigate(['/registerpaciente']);
  }

  navigateHome() {
    this.router.navigate(['/home']); 
  }
}