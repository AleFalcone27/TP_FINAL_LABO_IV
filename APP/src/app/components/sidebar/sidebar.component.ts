import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  providers: [AuthService],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] 
})
export class SidebarComponent implements OnInit {
  userRole: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.checkUserRole();
    console.log('a');
    
  }

  async checkUserRole() {
    this.userRole = this.authService.getRole() || ''; 
  }


  navigateToMyAppointments(){
    this.router.navigate(['paciente/misTurnos']);
  }

  navigateToMakeAnAppointment(){
    this.router.navigate(['paciente/reservarTurno']);
  }


  navigateToUsers(){
    this.router.navigate(['admin']);
  }

  navigateToMyVisits(){
    this.router.navigate(['especialista/misTurnos']);
  }



  LogOut(){
    this.authService.logOut();
    this.router.navigate(['login']);
  }


}