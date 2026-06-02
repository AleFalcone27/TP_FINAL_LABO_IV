import { Directive, ElementRef, Input } from '@angular/core';


@Directive({
  selector: '[appAppointmentStatusColor]',
  standalone: true
})
export class AppointmentStatusColorDirective {
  @Input() appAppointmentStatusColor!: number;

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    this.updateStyle();
  }

  private updateStyle() {
    const el = this.el.nativeElement;
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.style.padding = '4px 12px';
    el.style.borderRadius = '999px';
    el.style.fontSize = '0.75rem';
    el.style.fontWeight = '600';
    el.style.letterSpacing = '0.03em';
    el.style.whiteSpace = 'nowrap';

    switch (this.appAppointmentStatusColor) {
      case 0:
        el.style.backgroundColor = '#fef9c3';
        el.style.color = '#854d0e';
        break;
      case 1:
        el.style.backgroundColor = '#dcfce7';
        el.style.color = '#166534';
        break;
      case 2:
        el.style.backgroundColor = '#fee2e2';
        el.style.color = '#991b1b';
        break;
      case 3:
        el.style.backgroundColor = '#dbeafe';
        el.style.color = '#1e40af';
        break;
      case 5:
        el.style.backgroundColor = '#f1f5f9';
        el.style.color = '#475569';
        break;
      default:
        el.style.backgroundColor = '#f1f5f9';
        el.style.color = '#475569';
    }
  }
}
