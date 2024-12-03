import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { Chart, ChartData, ChartOptions, ArcElement, Tooltip, Legend, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  animations: []
})
export class InformesComponent {
  @ViewChild('doughnutCanvas', { static: false }) doughnutCanvas!: ElementRef;
  doughnutChart!: Chart;

  constructor(private appointmentsService: AppointmentsService) {}

  async ngAfterViewInit() {
    Chart.register(...registerables); // Register all necessary components
    await this.updateChartData();
  }

  private async updateChartData(): Promise<void> {
    const specialties = await this.getAppointmentBySpeciality();
    const specialtyCounts = this.countSpecialties(specialties);
  
    if (Object.keys(specialtyCounts).length === 0) {
      // Mostrar mensaje de no hay datos
      console.log('No se encontraron datos para mostrar en el gráfico.');
      return; // No renderizar el gráfico
    }
  
    const ctx = this.doughnutCanvas.nativeElement.getContext('2d');
    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(specialtyCounts),
        datasets: [{
          data: Object.values(specialtyCounts),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  private async getAppointmentBySpeciality(): Promise<{ especialidad: string }[]> {
    return await this.appointmentsService.getApponitmentbySpeciality();
  }

  private countSpecialties(specialties: { especialidad: string }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    specialties.forEach(specialty => {
      counts[specialty.especialidad] = (counts[specialty.especialidad] || 0) + 1;
    });
    return counts;
  }
}