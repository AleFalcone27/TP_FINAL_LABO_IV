import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appZoomInImages]',
  standalone: true
})
export class ZoomInImagesDirective {

  private originalWidth: string = '';
  private originalHeight: string = '';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.originalWidth = this.el.nativeElement.style.width;
    this.originalHeight = this.el.nativeElement.style.height;
    this.el.nativeElement.style.transition = 'transform 0.3s ease';
    this.el.nativeElement.style.transform = 'scale(1.2)'; 
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.el.nativeElement.style.transform = 'scale(1)';
  }
}


