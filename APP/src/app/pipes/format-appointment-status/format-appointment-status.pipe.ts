import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAppointmentStatus',
  standalone: true
})
export class FormatAppointmentStatusPipe implements PipeTransform {

  transform(value: number): string {
    switch (value) {
      case 0:
        return 'Pendiente';
      case 1:
        return 'Aceptado';
      case 2:
        return 'Rechazado';
      case 3:
        return 'Finalizado';
      case 4:
        return 'Cerrado';
      case 5:
        return 'Cancelado';
      default:
        return 'Estado desconocido';
    }
  }
}