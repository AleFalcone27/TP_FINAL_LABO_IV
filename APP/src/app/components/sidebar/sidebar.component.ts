import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  userRole: string = '';
  isLoggedIn: boolean = false;
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.checkUserRole();
    
    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authService.authState$.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      if (isAuthenticated) {
        this.checkUserRole();
      } else {
        this.userRole = '';
      }
    });

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkUserRole();
      }
    });
  }

  ngOnDestroy() {
    // Limpiar suscripción para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  async checkUserRole() {
    this.userRole = this.authService.getRole() || '';
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  navigateToLogin() {
    this.router.navigate(['login']);
  }

  navigateToRegister() {
    this.router.navigate(['register']);
  }

  navigateToMyAppointments() {
    this.router.navigate(['paciente/misTurnos']);
  }

  navigateToMakeAnAppointment() {
    this.router.navigate(['paciente/reservarTurno']);
  }

  navigateToUsers() {
    this.router.navigate(['admin']);
  }

  navigateToMyVisits() {
    this.router.navigate(['especialista/misTurnos']);
  }

  navigateToMyPatients() {
    this.router.navigate(['especialista/misPacientes']);
  }

  navigateToTurnos(){
    this.router.navigate(['admin/turnos']);
  }

  navigateToAdminMakeAppointment(){
    this.router.navigate(['admin/reservarTurno']);
  }

  navigateToPatientMedicalHistory(){
    this.router.navigate(['paciente/historiaMedica']);
  }

  navigateToInformes(){
    this.router.navigate(['admin/informes']);
  }

  logOut() {
    this.checkUserRole();
    this.authService.logOut();
    this.router.navigate(['home']);
    console.log(this.userRole)
  }

  navigateToProfile(){
    let role = this.authService.getRole() 
    this.router.navigate([`${role}/perfil`]);
  }

}
