import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';
import { SupabaseService } from '../../services/supabase/supabase.service';
import Swal from 'sweetalert2';

@Directive({
  selector: '[appOwnCaptcha]',
  standalone: true
})
export class OwnCaptchaDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() appOwnCaptchaEnabled = true;
  @Output() captchaValidated = new EventEmitter<boolean>();

  private userInput = '';
  private validString = '';
  private isCaptchaVisible = true;
  private elementsReady = false;

  private container?: HTMLDivElement;
  private image?: HTMLImageElement;
  private input?: HTMLInputElement;
  private validateButton?: HTMLButtonElement;
  private refreshButton?: HTMLButtonElement;
  private disabledAlert?: HTMLDivElement;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private supabaseService: SupabaseService
  ) {}

  ngAfterViewInit(): void {
    this.buildView();
    this.syncState();
    this.elementsReady = true;
    if (this.appOwnCaptchaEnabled) {
      void this.loadCaptcha();
    } else {
      this.captchaValidated.emit(true);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appOwnCaptchaEnabled'] && this.elementsReady) {
      this.syncState();
      if (this.appOwnCaptchaEnabled) {
        void this.loadCaptcha();
      } else {
        this.captchaValidated.emit(true);
      }
    }
  }

  ngOnDestroy(): void {
    this.host.nativeElement.innerHTML = '';
  }

  private buildView(): void {
    const root = this.renderer.createElement('div');
    this.renderer.addClass(root, 'row');
    this.renderer.addClass(root, 'g-5');

    const col = this.renderer.createElement('div');
    this.renderer.addClass(col, 'col-12');

    this.container = this.renderer.createElement('div');
    this.renderer.addClass(this.container, 'input-container');

    const imageWrapper = this.renderer.createElement('div');
    this.renderer.addClass(imageWrapper, 'mb-3');
    this.renderer.addClass(imageWrapper, 'mt-3');

    this.image = this.renderer.createElement('img');
    this.renderer.setAttribute(this.image, 'alt', 'Captcha');
    this.renderer.addClass(this.image, 'captcha-image');
    this.renderer.setStyle(this.image, 'border-radius', '10px');
    this.renderer.setStyle(this.image, 'border', '1px solid #e2e8f0');
    this.renderer.setStyle(this.image, 'box-shadow', '0 2px 8px rgba(0,0,0,0.08)');
    this.renderer.setStyle(this.image, 'max-width', '220px');
    this.renderer.setStyle(this.image, 'display', 'block');
    this.renderer.setStyle(this.image, 'margin', '0 auto');
    this.renderer.appendChild(imageWrapper, this.image);

    this.input = this.renderer.createElement('input');
    this.renderer.setAttribute(this.input, 'type', 'text');
    this.renderer.setAttribute(this.input, 'placeholder', 'Ingresa el captcha');
    this.renderer.addClass(this.input, 'form-control');
    this.renderer.listen(this.input, 'input', (event: Event) => {
      this.userInput = (event.target as HTMLInputElement).value;
    });

    this.validateButton = this.renderer.createElement('button');
    this.renderer.setProperty(this.validateButton, 'type', 'button');
    this.renderer.addClass(this.validateButton, 'btn');
    this.renderer.addClass(this.validateButton, 'btn-primary');
    this.renderer.appendChild(this.validateButton, this.renderer.createText('Validar'));
    this.renderer.listen(this.validateButton, 'click', () => this.validateCaptcha());

    this.refreshButton = this.renderer.createElement('button');
    this.renderer.setProperty(this.refreshButton, 'type', 'button');
    this.renderer.addClass(this.refreshButton, 'btn');
    this.renderer.addClass(this.refreshButton, 'btn-secondary');
    this.renderer.appendChild(this.refreshButton, this.renderer.createText('Refrescar'));
    this.renderer.listen(this.refreshButton, 'click', () => this.refreshCaptcha());

    const actions = this.renderer.createElement('div');
    this.renderer.addClass(actions, 'captcha-actions');
    this.renderer.setStyle(actions, 'display', 'flex');
    this.renderer.setStyle(actions, 'gap', '8px');
    this.renderer.setStyle(actions, 'justify-content', 'center');
    this.renderer.setStyle(actions, 'margin-top', '12px');
    this.renderer.appendChild(actions, this.validateButton);
    this.renderer.appendChild(actions, this.refreshButton);

    this.disabledAlert = this.renderer.createElement('div');
    this.renderer.addClass(this.disabledAlert, 'alert');
    this.renderer.addClass(this.disabledAlert, 'alert-info');
    this.renderer.addClass(this.disabledAlert, 'text-center');
    this.renderer.addClass(this.disabledAlert, 'mt-3');
    this.renderer.appendChild(this.disabledAlert, this.renderer.createText('El captcha está desactivado'));

    this.renderer.appendChild(this.container, imageWrapper);
    this.renderer.appendChild(this.container, this.input);
    this.renderer.appendChild(this.container, actions);
    this.renderer.appendChild(this.container, this.disabledAlert);
    this.renderer.appendChild(col, this.container);
    this.renderer.appendChild(root, col);
    this.renderer.appendChild(this.host.nativeElement, root);
  }

  private syncState(): void {
    if (!this.container || !this.input || !this.image || !this.validateButton || !this.refreshButton || !this.disabledAlert) {
      return;
    }

    const enabled = this.appOwnCaptchaEnabled;
    this.renderer.setStyle(this.container, 'display', enabled ? 'block' : 'none');
    this.renderer.setStyle(this.disabledAlert, 'display', enabled ? 'none' : 'block');
    this.renderer.setProperty(this.input, 'disabled', !enabled);
    this.renderer.setProperty(this.validateButton, 'disabled', !enabled);
    this.renderer.setProperty(this.refreshButton, 'disabled', !enabled);
    if (!enabled) {
      this.renderer.setProperty(this.input, 'value', '');
      this.userInput = '';
      this.isCaptchaVisible = false;
    }
  }

  refreshCaptcha(): void {
    this.userInput = '';
    this.validString = '';
    if (this.input) {
      this.renderer.setProperty(this.input, 'value', '');
    }
    void this.loadCaptcha();
  }

  private async loadCaptcha(): Promise<void> {
    try {
      const randomIndex = Math.floor(Math.random() * 3) + 1;
      const path = `captcha${randomIndex}.jpeg`;
      const { data } = this.supabaseService.getPublicUrl('other', path);
      if (this.image) {
        this.renderer.setAttribute(this.image, 'src', data.publicUrl);
      }

      this.validString = this.getValidString(randomIndex);
      this.isCaptchaVisible = true;
    } catch (error) {
      console.error('Error al cargar captcha:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cargar el captcha. Por favor, refresca la página.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  }

  private getValidString(randomIndex: number): string {
    switch (randomIndex) {
      case 1:
        return '61760';
      case 2:
        return 'YKQET';
      case 3:
        return 'sciarna';
      default:
        return '';
    }
  }

  validateCaptcha(): void {
    if (!this.appOwnCaptchaEnabled) {
      this.captchaValidated.emit(true);
      return;
    }

    if (this.userInput === this.validString) {
      this.captchaValidated.emit(true);
      this.showSuccessPopup();
      this.isCaptchaVisible = false;
      if (this.input) {
        this.renderer.setProperty(this.input, 'disabled', true);
      }
    } else {
      this.showErrorPopup();
      this.captchaValidated.emit(false);
    }
  }

  private showSuccessPopup(): void {
    Swal.fire({
      title: '¡Éxito!',
      text: 'El captcha ha sido validado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  }

  private showErrorPopup(): void {
    Swal.fire({
      title: '¡Error!',
      text: '¿Eres un humano?',
      icon: 'error',
      confirmButtonText: 'Volver a intentar'
    });
  }
}
