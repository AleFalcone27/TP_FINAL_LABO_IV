import { Directive, ElementRef, Input } from '@angular/core';


@Directive({
  selector: '[appAppointmentStatusColor]',
  standalone: true
})
export class AppointmentStatusColorDirective {
  @Input() appAppointmentStatusColor!: number;

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    this.updateColor();
  }

  private updateColor() {
    switch (this.appAppointmentStatusColor) {
      case 0:
        this.el.nativeElement.style.backgroundColor = '#ffeb3b'; // Amarillo Pastel (Pendiente)
        break;
      case 1:
        this.el.nativeElement.style.backgroundColor = '#a5d6a7'; // Verde Pastel (Aceptado)
        break;
      case 2:
        this.el.nativeElement.style.backgroundColor = '#ef9a9a'; // Rojo Pastel (Rechazado)
        break;
      case 3:
        this.el.nativeElement.style.backgroundColor = '#90caf9'; // Azul Pastel (Finalizado)
        break;
      case 5:
        this.el.nativeElement.style.backgroundColor = '#e0e0e0'; // Gris Pastel (Cancelado)
        break;
      default:
        this.el.nativeElement.style.backgroundColor = '#ffffff'; // Blanco (Estado desconocido)
    }
  }
}
