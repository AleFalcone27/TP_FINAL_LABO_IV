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
import { AuthService } from '../../../services/auth/auth.service';

interface LoginLog {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  loggedAt: Timestamp;
}

interface LoginReportRow {
  user: string;
  email: string;
  role: string;
  day: string;
  time: string;
}

interface CountReportRow {
  label: string;
  count: number;
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

  loginRows: LoginReportRow[] = [];
  specialtyRows: CountReportRow[] = [];
  dayRows: CountReportRow[] = [];
  requestedDoctorRows: CountReportRow[] = [];
  finishedDoctorRows: CountReportRow[] = [];
  clinicVisitsRows: CountReportRow[] = [];
  patientsBySpecialtyRows: CountReportRow[] = [];
  doctorsBySpecialtyRows: CountReportRow[] = [];

  startDate = '';
  endDate = '';
  isLoading = true;
  language: 'es' | 'en' | 'pt' = 'es';

  readonly translations = {
    es: {
      pageTitle: 'Informes',
      from: 'Desde',
      to: 'Hasta',
      loading: 'Cargando informes...',
      noLogins: 'Todavia no hay ingresos registrados.',
      loginLogTitle: 'Log de ingresos al sistema',
      loginLogPdf: 'Log de ingresos al sistema',
      user: 'Usuario',
      email: 'Email',
      role: 'Rol',
      day: 'Dia',
      time: 'Horario',
      specialtyAppointments: 'Cantidad de turnos por especialidad',
      dayAppointments: 'Cantidad de turnos por dia',
      clinicVisits: 'Cantidad de visitas de la clinica',
      patientsBySpecialty: 'Pacientes por especialidad',
      doctorsBySpecialty: 'Medicos por especialidad',
      requestedByDoctor: 'Turnos solicitados por medico',
      finishedByDoctor: 'Turnos finalizados por medico',
      exportExcel: 'Excel',
      exportPdf: 'PDF',
      loginExcelFile: 'log-ingresos',
      specialtyExcelFile: 'turnos-por-especialidad',
      dayExcelFile: 'turnos-por-dia',
      clinicVisitsExcelFile: 'visitas-clinica',
      patientsExcelFile: 'pacientes-por-especialidad',
      doctorsExcelFile: 'medicos-por-especialidad',
      requestedExcelFile: 'turnos-solicitados-por-medico',
      finishedExcelFile: 'turnos-finalizados-por-medico',
      noData: 'Sin datos',
      admin: 'Administrador',
      patient: 'Paciente',
      specialist: 'Especialista',
      noSpecialty: 'Sin especialidad',
      noDoctor: 'Sin medico',
      reportTitle: 'Informe'
    },
    en: {
      pageTitle: 'Reports',
      from: 'From',
      to: 'To',
      loading: 'Loading reports...',
      noLogins: 'There are no recorded logins yet.',
      loginLogTitle: 'System login log',
      loginLogPdf: 'System login log',
      user: 'User',
      email: 'Email',
      role: 'Role',
      day: 'Day',
      time: 'Time',
      specialtyAppointments: 'Appointments by specialty',
      dayAppointments: 'Appointments by day',
      clinicVisits: 'Clinic visits',
      patientsBySpecialty: 'Patients by specialty',
      doctorsBySpecialty: 'Doctors by specialty',
      requestedByDoctor: 'Requested appointments by doctor',
      finishedByDoctor: 'Completed appointments by doctor',
      exportExcel: 'Excel',
      exportPdf: 'PDF',
      loginExcelFile: 'login-log',
      specialtyExcelFile: 'appointments-by-specialty',
      dayExcelFile: 'appointments-by-day',
      clinicVisitsExcelFile: 'clinic-visits',
      patientsExcelFile: 'patients-by-specialty',
      doctorsExcelFile: 'doctors-by-specialty',
      requestedExcelFile: 'requested-by-doctor',
      finishedExcelFile: 'finished-by-doctor',
      noData: 'No data',
      admin: 'Administrator',
      patient: 'Patient',
      specialist: 'Specialist',
      noSpecialty: 'No specialty',
      noDoctor: 'No doctor',
      reportTitle: 'Report'
    },
    pt: {
      pageTitle: 'Relatórios',
      from: 'De',
      to: 'Até',
      loading: 'Carregando relatórios...',
      noLogins: 'Ainda não há registros de acesso.',
      loginLogTitle: 'Registro de acessos ao sistema',
      loginLogPdf: 'Registro de acessos ao sistema',
      user: 'Usuário',
      email: 'E-mail',
      role: 'Função',
      day: 'Dia',
      time: 'Horário',
      specialtyAppointments: 'Quantidade de consultas por especialidade',
      dayAppointments: 'Quantidade de consultas por dia',
      clinicVisits: 'Quantidade de visitas da clínica',
      patientsBySpecialty: 'Pacientes por especialidade',
      doctorsBySpecialty: 'Médicos por especialidade',
      requestedByDoctor: 'Consultas solicitadas por médico',
      finishedByDoctor: 'Consultas finalizadas por médico',
      exportExcel: 'Excel',
      exportPdf: 'PDF',
      loginExcelFile: 'registros-acesso',
      specialtyExcelFile: 'consultas-por-especialidade',
      dayExcelFile: 'consultas-por-dia',
      clinicVisitsExcelFile: 'visitas-clinica',
      patientsExcelFile: 'pacientes-por-especialidade',
      doctorsExcelFile: 'medicos-por-especialidade',
      requestedExcelFile: 'consultas-solicitadas-por-medico',
      finishedExcelFile: 'consultas-finalizadas-por-medico',
      noData: 'Sem dados',
      admin: 'Administrador',
      patient: 'Paciente',
      specialist: 'Especialista',
      noSpecialty: 'Sem especialidade',
      noDoctor: 'Sem médico',
      reportTitle: 'Relatório'
    }
  } as const;

  private charts: Chart[] = [];
  private readonly clinicLogoUrl = 'https://pdxwznmonhqdpvxpadpa.supabase.co/storage/v1/object/public/other/logo.png';

  constructor(
    private appointmentsService: AppointmentsService,
    private userService: UserService,
    private firestore: Firestore,
    private authService: AuthService,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    Chart.register(...registerables);
    this.language = this.authService.getLanguage();
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

  exportExcel(rows: Array<LoginReportRow | CountReportRow>, filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, this.t.reportTitle);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  exportPdf(rows: Array<LoginReportRow | CountReportRow>, title: string, filename: string): void {
    void this.exportPdfWithLogo(rows, title, filename);
  }

  private async exportPdfWithLogo(rows: Array<LoginReportRow | CountReportRow>, title: string, filename: string): Promise<void> {
    const pdf = new jsPDF();
    const headers = Object.keys(rows[0] || { Informe: 'Sin datos' });
    const body = rows.length
      ? rows.map(row => headers.map(header => `${((row as unknown) as Record<string, string | number>)[header] ?? ''}`))
      : [['Sin datos']];
    const generatedAt = new Date();
    const generatedLabel = generatedAt.toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const logoDataUrl = await this.loadImageAsDataUrl(this.clinicLogoUrl);

    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, 'PNG', 14, 10, 12, 12);
      pdf.setFontSize(14);
      pdf.text('Clínica Online', 30, 16);
      pdf.setFontSize(16);
      pdf.text(title, 30, 22);
    } else {
      pdf.setFontSize(14);
      pdf.text('Clínica Online', 14, 16);
      pdf.setFontSize(16);
      pdf.text(title, 14, 22);
    }

    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Generado el: ${generatedLabel}`, 14, 30);
    pdf.setTextColor(0);

    autoTable(pdf, {
      startY: 36,
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
        user: `${log.firstName || ''} ${log.lastName || ''}`.trim() || log.email,
        email: log.email,
        role: this.translateRole(log.role),
        day: loggedAt.toLocaleDateString(),
        time: loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    this.specialtyRows = this.countBy(rangedAppointments, appointment => appointment.specialty || 'Sin especialidad')
      .map(row => ({ label: row.label, count: row.count }));

    this.dayRows = this.countBy(rangedAppointments, appointment => this.toDate(appointment.date).toLocaleDateString())
      .map(row => ({ label: row.label, count: row.count }));

    this.requestedDoctorRows = this.countBy(rangedAppointments, appointment => this.getDoctorName(appointment))
      .map(row => ({ label: row.label, count: row.count }));

    this.finishedDoctorRows = this.countBy(
      rangedAppointments.filter(appointment => appointment.status === 4),
      appointment => this.getDoctorName(appointment)
    ).map(row => ({ label: row.label, count: row.count }));

    this.clinicVisitsRows = this.countBy(rangedAppointments, appointment => this.toDate(appointment.date).toLocaleDateString())
      .map(row => ({ label: row.label, count: row.count }));

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
      .map(([label, patients]) => ({ label, count: patients.size }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    const doctorsBySpecialty = new Map<string, Set<string>>();
    for (const appointment of rangedAppointments) {
      const specialty = appointment.specialty || 'Sin especialidad';
      const doctorId = appointment.uidDoctor || `${appointment.doctorFirstName || ''} ${appointment.doctorLastName || ''}`.trim();
      if (!doctorId) continue;

      if (!doctorsBySpecialty.has(specialty)) {
        doctorsBySpecialty.set(specialty, new Set<string>());
      }
      doctorsBySpecialty.get(specialty)?.add(doctorId);
    }
    this.doctorsBySpecialtyRows = [...doctorsBySpecialty.entries()]
      .map(([label, doctors]) => ({ label, count: doctors.size }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.charts = [
      this.createBarChart(this.specialtyCanvas, this.t.specialtyAppointments, this.specialtyRows),
      this.createBarChart(this.dayCanvas, this.t.dayAppointments, this.dayRows),
      this.createBarChart(this.requestedDoctorCanvas, this.t.requestedByDoctor, this.requestedDoctorRows),
      this.createBarChart(this.finishedDoctorCanvas, this.t.finishedByDoctor, this.finishedDoctorRows),
      this.createBarChart(this.clinicVisitsCanvas, this.t.clinicVisits, this.clinicVisitsRows),
      this.createBarChart(this.patientsBySpecialtyCanvas, this.t.patientsBySpecialty, this.patientsBySpecialtyRows),
      this.createBarChart(this.doctorsBySpecialtyCanvas, this.t.doctorsBySpecialty, this.doctorsBySpecialtyRows)
    ].filter((chart): chart is Chart => Boolean(chart));
  }

  private scheduleRenderCharts(): void {
    setTimeout(() => this.renderCharts());
  }

  private createBarChart(
    canvas: ElementRef<HTMLCanvasElement> | undefined,
    label: string,
    rows: CountReportRow[]
  ): Chart | null {
    const context = canvas?.nativeElement?.getContext('2d');
    if (!context) return null;

    return new Chart(context, {
      type: 'bar',
      data: {
        labels: rows.map(row => row.label),
        datasets: [{
          label,
          data: rows.map(row => Number(row.count || 0)),
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

  private async loadImageAsDataUrl(url: string): Promise<string | null> {
    try {
      return await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';

        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;

          const context = canvas.getContext('2d');
          if (!context) {
            resolve(null);
            return;
          }

          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };

        image.onerror = () => resolve(null);
        image.src = url;
      });
    } catch {
      return null;
    }
  }

  private getDoctorName(appointment: Appointment): string {
    return `${appointment.doctorFirstName || ''} ${appointment.doctorLastName || ''}`.trim() || this.t.noDoctor;
  }

  private translateRole(role: string): string {
    const roles: Record<string, string> = {
      admin: this.t.admin,
      paciente: this.t.patient,
      especialista: this.t.specialist
    };
    return roles[role] || role;
  }

  get t() {
    return this.translations[this.language];
  }
}
