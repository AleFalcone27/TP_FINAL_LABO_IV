// users-table.component.ts
import { booleanAttribute, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/users/users.service';
import { User } from '../../../interfaces/user';
import { Doctor } from '../../../interfaces/doctor';
import { Admin } from '../../../interfaces/admin';
import { SpinnerComponent } from '../../spinner/spinner.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  providers: [UserService],
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.css']
})
export class UsersTableComponent implements OnInit {
  users: (User | Admin | Doctor)[] = [];
  filteredUsers: (User | Admin | Doctor)[] = [];
  selectedRole: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = true;
  columns: Column[] = [];
  loadingMessage = '';

  constructor(private userService: UserService) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      switch (this.selectedRole) {
        case 'user':
          this.users = await this.userService.getUsers();
          break;
        case 'doctor':
          this.users = await this.userService.getDoctors();
          break;
        case 'admin':
          this.users = await this.userService.getAdmins();
          break;
        default:
          const [users, doctors, admins] = await Promise.all([
            this.userService.getUsers(),
            this.userService.getDoctors(),
            this.userService.getAdmins()
          ]);
          this.users = [...users, ...doctors, ...admins];
      }
      this.applyFilters();
    } catch (error) {
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {

    let filtered = [...this.users];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    console.log('Filtered users:', filtered);
    this.filteredUsers = filtered;
  }

  setColumns() {
    switch (this.selectedRole) {
      case 'all':
        this.columns = [
          { header: 'Nombre', field: 'firstName' },
          { header: 'Apellido', field: 'lastName' },
          { header: 'Email', field: 'email' },
          { header: 'Rol', field: 'role' }
        ];
        break;
      case 'user':
        this.columns = [
          { header: 'Nombre Completo', field: 'fullName' },
          { header: 'DNI', field: 'dni' },
          { header: 'Obra Social', field: 'socialInsurance' },
          { header: 'Email', field: 'email' }
        ];
        break;
      case 'doctor':
        this.columns = [
          { header: 'Nombre Completo', field: 'fullName' },
          { header: 'Especialidad', field: 'specialty' },
          { header: 'Estado', field: 'approved' },
          { header: 'Email', field: 'email' }
        ];
        break;
      case 'admin':
        this.columns = [
          { header: 'Nombre Completo', field: 'fullName' },
          { header: 'Email', field: 'email' },
          { header: 'Nivel de Acceso', field: 'accessLevel' }
        ];
        break;
    }
  }

  async onRoleChange() {
    await this.loadUsers();
  }

  downloadExcel(): void {

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    
    const data = this.filteredUsers.map(user => ({
      'UID': user.uid,
      'Nombre': user.firstName,
      'Apellido': user.lastName,
      'Email': user.email,
      'Rol': this.translateRole(user.role),
      'Estado': this.isDoctor(user) ? (user.approved ? 'Aprobado' : 'Pendiente') : 'N/A'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

    XLSX.writeFile(workbook, 'usuariosClinicaOnline.xlsx');
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  isDoctor(user: User | Admin | Doctor): user is Doctor {
    return (user as Doctor).approved !== undefined;
  }

  isAdmin(user: User | Admin | Doctor): user is Admin {
    return user.role === 'admin';
  }

  isUser(user: User | Admin | Doctor): user is User {
    return user.role === 'user';
  }


  getValue(user: User | Admin | Doctor, field: string): string {
    if (!user) return '-';
  
    switch (field) {
      case 'fullName':
        return `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
  
      case 'dni':
        if (this.isUser(user)) {
          return user.dni ? this.formatDNI(user.dni) : 'No registrado';
        }
        return '-';
  
      case 'socialInsurance':
        if (this.isUser(user)) {
          return user.socialInsurance || 'Sin obra social';
        }
        return '-';
  
      case 'specialty':
        if (this.isDoctor(user)) {
          return user.specialty || 'No especificada';
        }
        return '-';
  
      case 'approved':
        if (this.isDoctor(user)) {
          return user.approved ? '✅ Aprobado' : '❌ Pendiente';
        }
        return '-';
  
      case 'email':
        return user.email?.toLowerCase() || 'Sin email';
  
      case 'role':
        return this.translateRole(user.role);
  
      default:
        return (user as any)[field]?.toString() || '-';
    }
  }
  
  private translateRole(role: string): string {
    const roles = {
      'user': 'Paciente',
      'doctor': 'Doctor',
      'admin': 'Administrador'
    };
    return roles[role as keyof typeof roles] || role;
  }
  
  // Métodos auxiliares
  private formatDNI(dni: string): string {
    // Formato: XX.XXX.XXX
    return dni.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3');
  }

  async toggleDoctorStatus(especialista: Doctor): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Actualizando estado';
  
    try {
      await this.userService.updateDoctorStatus(especialista.uid, !especialista.approved);
      await this.loadUsers();
    } catch (error) {
      console.error('Error al actualizar el estado del doctor:', error);
    } finally {
      this.isLoading = false; 
      this.loadingMessage = '';
    }
  }

  getStatusButtonText(approved: boolean): string {
    return approved ? 'Desaprobar' : 'Aprobar';
  }


}

interface Column {
  header: string;
  field: string;
}