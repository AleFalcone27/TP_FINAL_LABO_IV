import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './perfil-admin.component.html',
  styleUrl: './perfil-admin.component.css'
})
export class PerfilAdminComponent implements OnInit{
  userData: any;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getUser()
    this.userData = this.authService.getUserData();
    console.log(this.userData)
  }
}
