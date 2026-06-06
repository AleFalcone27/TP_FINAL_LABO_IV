import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, Timestamp, collection, getDocs } from '@angular/fire/firestore';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { Appointment } from '../../../interfaces/appointment';
import { AppointmentsService } from '../../../services/appointments/appointments.service';
import { UserService } from '../../../services/users/users.service';
import { Doctor } from '../../../interfaces/doctor';
import { User } from '../../../interfaces/user';

interface LoginLog {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  loggedAt: Timestamp;
}

interface ReportRow {
  [key: string]: string | number;
}

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.css'],
  animations: []
})
export class InformesComponent implements AfterViewInit {
  @ViewChild('specialtyCanvas') specialtyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('dayCanvas') dayCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('requestedDoctorCanvas') requestedDoctorCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('finishedDoctorCanvas') finishedDoctorCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('clinicVisitsCanvas') clinicVisitsCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('patientsBySpecialtyCanvas') patientsBySpecialtyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('doctorsBySpecialtyCanvas') doctorsBySpecialtyCanvas?: ElementRef<HTMLCanvasElement>;

  appointments: Appointment[] = [];
  loginLogs: LoginLog[] = [];
  doctors: Doctor[] = [];
  patients: User[] = [];

  loginRows: ReportRow[] = [];
  specialtyRows: ReportRow[] = [];
  dayRows: ReportRow[] = [];
  requestedDoctorRows: ReportRow[] = [];
  finishedDoctorRows: ReportRow[] = [];
  clinicVisitsRows: ReportRow[] = [];
  patientsBySpecialtyRows: ReportRow[] = [];
  doctorsBySpecialtyRows: ReportRow[] = [];

  startDate = '';
  endDate = '';
  isLoading = true;

  private charts: Chart[] = [];

  constructor(
    private appointmentsService: AppointmentsService,
    private userService: UserService,
    private firestore: Firestore
  ) {}

  async ngAfterViewInit(): Promise<void> {
    Chart.register(...registerables);
    this.setDefaultDateRange();
    await this.loadReports();
  }

  async loadReports(): Promise<void> {
    try {
      this.isLoading = true;
      const [appointments, loginLogs] = await Promise.all([
        this.appointmentsService.getAllAppointments(),
        this.getLoginLogs()
      ]);
      const [doctors, patients] = await Promise.all([
        this.userService.getDoctors(),
        this.userService.getUsers()
      ]);

      this.appointments = appointments;
      this.loginLogs = loginLogs;
      this.doctors = doctors;
      this.patients = patients;
      this.buildReports();
    } catch (error) {
      console.error('Error cargando informes:', error);
    } finally {
      this.isLoading = false;
      this.scheduleRenderCharts();
    }
  }

  onDateRangeChange(): void {
    this.buildReports();
    this.scheduleRenderCharts();
  }

  exportExcel(rows: ReportRow[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Informe');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  exportPdf(rows: ReportRow[], title: string, filename: string): void {
    const pdf = new jsPDF();
    const headers = Object.keys(rows[0] || { Informe: 'Sin datos' });
    const body = rows.length
      ? rows.map(row => headers.map(header => `${row[header] ?? ''}`))
      : [['Sin datos']];

    pdf.setFontSize(16);
    pdf.text(title, 14, 18);
    autoTable(pdf, {
      startY: 26,
      head: [headers],
      body,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42] }
    });
    pdf.save(`${filename}.pdf`);
  }

  private async getLoginLogs(): Promise<LoginLog[]> {
    const snapshot = await getDocs(collection(this.firestore, 'loginLogs'));
    return snapshot.docs
      .map(doc => doc.data() as LoginLog)
      .sort((a, b) => this.toDate(b.loggedAt).getTime() - this.toDate(a.loggedAt).getTime());
  }

  private buildReports(): void {
    const rangedAppointments = this.appointments.filter(appointment => this.isInSelectedRange(this.toDate(appointment.date)));

    this.loginRows = this.loginLogs.map(log => {
      const loggedAt = this.toDate(log.loggedAt);
      return {
        Usuario: `${log.firstName || ''} ${log.lastName || ''}`.trim() || log.email,
        Email: log.email,
        Rol: this.translateRole(log.role),
        Dia: loggedAt.toLocaleDateString(),
        Horario: loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    this.specialtyRows = this.countBy(this.appointments, appointment => appointment.specialty || 'Sin especialidad')
      .map(row => ({ Especialidad: row.label, Turnos: row.count }));

    this.dayRows = this.countBy(this.appointments, appointment => this.toDate(appointment.date).toLocaleDateString())
      .map(row => ({ Dia: row.label, Turnos: row.count }));

    this.requestedDoctorRows = this.countBy(rangedAppointments, appointment => this.getDoctorName(appointment))
      .map(row => ({ Medico: row.label, TurnosSolicitados: row.count }));

    this.finishedDoctorRows = this.countBy(
      rangedAppointments.filter(appointment => appointment.status === 4),
      appointment => this.getDoctorName(appointment)
    ).map(row => ({ Medico: row.label, TurnosFinalizados: row.count }));

    this.clinicVisitsRows = this.countBy(rangedAppointments, appointment => this.toDate(appointment.date).toLocaleDateString())
      .map(row => ({ Dia: row.label, Visitas: row.count }));

    const patientsBySpecialty = new Map<string, Set<string>>();
    for (const appointment of rangedAppointments) {
      const specialty = appointment.specialty || 'Sin especialidad';
      const uidPatient = appointment.uidPatient || `${appointment.patientFirstName || ''} ${appointment.patientLastName || ''}`.trim();
      if (!patientsBySpecialty.has(specialty)) {
        patientsBySpecialty.set(specialty, new Set<string>());
      }
      if (uidPatient) {
        patientsBySpecialty.get(specialty)?.add(uidPatient);
      }
    }
    this.patientsBySpecialtyRows = [...patientsBySpecialty.entries()]
      .map(([label, patients]) => ({ Especialidad: label, Pacientes: patients.size }))
      .sort((a, b) => Number(b.Pacientes) - Number(a.Pacientes) || `${a.Especialidad}`.localeCompare(`${b.Especialidad}`));

    const doctorsBySpecialty = new Map<string, number>();
    for (const doctor of this.doctors) {
      const specialties = Array.isArray((doctor as any).specialties)
        ? (doctor as any).specialties
        : doctor.specialty
          ? [doctor.specialty]
          : ['Sin especialidad'];

      for (const specialty of specialties) {
        doctorsBySpecialty.set(specialty || 'Sin especialidad', (doctorsBySpecialty.get(specialty || 'Sin especialidad') || 0) + 1);
      }
    }
    this.doctorsBySpecialtyRows = [...doctorsBySpecialty.entries()]
      .map(([label, count]) => ({ Especialidad: label, Medicos: count }))
      .sort((a, b) => Number(b.Medicos) - Number(a.Medicos) || `${a.Especialidad}`.localeCompare(`${b.Especialidad}`));
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.charts = [
      this.createBarChart(this.specialtyCanvas, 'Turnos por especialidad', this.specialtyRows, 'Especialidad', 'Turnos'),
      this.createBarChart(this.dayCanvas, 'Turnos por dia', this.dayRows, 'Dia', 'Turnos'),
      this.createBarChart(this.requestedDoctorCanvas, 'Turnos solicitados por medico', this.requestedDoctorRows, 'Medico', 'TurnosSolicitados'),
      this.createBarChart(this.finishedDoctorCanvas, 'Turnos finalizados por medico', this.finishedDoctorRows, 'Medico', 'TurnosFinalizados'),
      this.createBarChart(this.clinicVisitsCanvas, 'Cantidad de visitas de la clinica', this.clinicVisitsRows, 'Dia', 'Visitas'),
      this.createBarChart(this.patientsBySpecialtyCanvas, 'Pacientes por especialidad', this.patientsBySpecialtyRows, 'Especialidad', 'Pacientes'),
      this.createBarChart(this.doctorsBySpecialtyCanvas, 'Medicos por especialidad', this.doctorsBySpecialtyRows, 'Especialidad', 'Medicos')
    ].filter((chart): chart is Chart => Boolean(chart));
  }

  private scheduleRenderCharts(): void {
    setTimeout(() => this.renderCharts());
  }

  private createBarChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    label: string,
    rows: ReportRow[],
    labelKey: string,
    valueKey: string
  ): Chart | null {
    const context = canvas?.nativeElement?.getContext('2d');
    if (!context) return null;

    return new Chart(context, {
      type: 'bar',
      data: {
        labels: rows.map(row => `${row[labelKey]}`),
        datasets: [{
          label,
          data: rows.map(row => Number(row[valueKey] || 0)),
          backgroundColor: '#2563eb',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  private countBy(items: Appointment[], getKey: (appointment: Appointment) => string): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = getKey(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  private isInSelectedRange(date: Date): boolean {
    const start = this.startDate ? new Date(`${this.startDate}T00:00:00`) : null;
    const end = this.endDate ? new Date(`${this.endDate}T23:59:59`) : null;
    return (!start || date >= start) && (!end || date <= end);
  }

  private setDefaultDateRange(): void {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.toDateInputValue(monthStart);
    this.endDate = this.toDateInputValue(today);
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private toDate(value: Timestamp | Date | any): Date {
    return value?.toDate ? value.toDate() : new Date(value);
  }

  private getDoctorName(appointment: Appointment): string {
    return `${appointment.doctorFirstName || ''} ${appointment.doctorLastName || ''}`.trim() || 'Sin medico';
  }

  private translateRole(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      paciente: 'Paciente',
      especialista: 'Especialista'
    };
    return roles[role] || role;
  }
}
