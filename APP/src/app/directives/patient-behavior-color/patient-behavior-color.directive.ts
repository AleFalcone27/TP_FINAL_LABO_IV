import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appPatientBehaviorColor]',
  standalone: true
})
export class PatientBehaviorColorDirective implements OnChanges {
  @Input() appPatientBehaviorColor!: number;

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    this.updateColor();
  }

  private updateColor() {
    if (this.appPatientBehaviorColor < 25) {
      this.el.nativeElement.style.color = 'red'; 
    } else if (this.appPatientBehaviorColor >= 25 && this.appPatientBehaviorColor < 50) {
      this.el.nativeElement.style.color = 'blue'; 
    } else {
      this.el.nativeElement.style.color = 'green'; 
    }
  }
}