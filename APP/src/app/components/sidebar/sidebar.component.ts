import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userRole: string = '';
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService, private router: Router) {

    
  }

  ngOnInit() {
    this.checkUserRole();
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  async checkUserRole() {
    this.userRole = this.authService.getRole() || '';
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

  navigateToTurnos(){
    this.router.navigate(['admin/turnos']);
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
