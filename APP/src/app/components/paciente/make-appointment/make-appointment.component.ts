import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-make-appointment',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './make-appointment.component.html',
  styleUrls: ['./make-appointment.component.css']
})
export class MakeAppointmentComponent implements OnInit {

  specialties: { especialidad: string; image: string }[] = []; 
  doctors: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadSpecialties();
  }

  async loadSpecialties(): Promise<void> {
    try {
      this.specialties = await this.authService.getSpecialties();
      console.log('Especialidades cargadas:', this.specialties);
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  async selectSpecialty(specialty: string): Promise<void> {
    try {
      console.log('Especialidad seleccionada:', specialty);
      this.doctors = await this.authService.getDoctorsBySpecialty(specialty);
      console.log('Doctores encontrados:', this.doctors);
    } catch (error) {
      console.error('Error al cargar los doctores:', error);
    }
  }


}
