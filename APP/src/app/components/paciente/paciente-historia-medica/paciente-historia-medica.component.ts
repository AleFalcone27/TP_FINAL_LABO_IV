import { Component } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { AuthService } from '../../../services/auth/auth.service';
import { SpinnerComponent } from '../../spinner/spinner.component';
import { MedicalHistory } from '../../../interfaces/medicalHistory';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PatientBehaviorColorDirective } from '../../../directives/patient-behavior-color/patient-behavior-color.directive';

@Component({
  selector: 'app-paciente-historia-medica',
  standalone: true,
  imports: [SidebarComponent,SpinnerComponent,FormsModule,CommonModule,PatientBehaviorColorDirective],
  templateUrl: './paciente-historia-medica.component.html',
  styleUrl: './paciente-historia-medica.component.css'
})
export class PacienteHistoriaMedicaComponent {
  isLoading = false;
  loadingMessage = '';
  medicalHistories: MedicalHistory[] = []; 
  filteredMedicalHistories: MedicalHistory[] = []; 
  searchTerm: string = '';

  constructor(
    private appointmentsService: AppointmentsService,
    private authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.loadMedicalHistory();
  }

  private async loadMedicalHistory(): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Cargando historial médico...';

    const userData = this.authService.getUserData();
    const userId = userData.uid; 

    console.log(userData);

    if (userId) {
      try {
        this.medicalHistories = await this.appointmentsService.getMedicalHistoryByUserID(userId);
        console.log(this.medicalHistories);
        
        if (this.medicalHistories.length === 0) {
          this.loadingMessage = 'No se encontraron historiales médicos para este usuario.';
        } else {
          this.filteredMedicalHistories = this.medicalHistories; 
          this.applyFilters(); // Asegúrate de aplicar filtros después de cargar los datos
        }
      } catch (error) {
        console.error('Error al cargar el historial médico:', error);
        this.loadingMessage = 'Ocurrió un error al cargar el historial médico.';
      }
    } else {
      this.loadingMessage = 'No se pudo obtener el ID del usuario.';
    }

    this.isLoading = false; 
}

formatDate(date: { seconds: number; nanoseconds: number }): string {
  const dateObj = new Date(date.seconds * 1000); 
  return dateObj.toLocaleDateString();
}

applyFilters() {
  if (this.searchTerm) {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredMedicalHistories = this.medicalHistories.filter(medicalHistory => {

      const matchesBasicFields = 
        medicalHistory.doctorFirstName.toLowerCase().includes(searchLower) ||
        medicalHistory.doctorLastName.toLowerCase().includes(searchLower) ||
        medicalHistory.height.toString().includes(searchLower) || 
        medicalHistory.weight.toString().includes(searchLower) || 
        medicalHistory.pressure.toString().includes(searchLower);

      const matchesDynamicData = medicalHistory.dynamicData.some(data => 
        data.key.toLowerCase().includes(searchLower) || 
        data.value.toString().toLowerCase().includes(searchLower)
      );

      return matchesBasicFields || matchesDynamicData;
    });
  } else {
    this.filteredMedicalHistories = this.medicalHistories;
  }

  console.log(this.filteredMedicalHistories);
  console.log(this.medicalHistories);
}

onSearch(event: Event) {
  this.searchTerm = (event.target as HTMLInputElement).value;
  this.applyFilters();
}
}