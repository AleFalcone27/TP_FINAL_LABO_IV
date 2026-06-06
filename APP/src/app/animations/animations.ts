import { trigger, style, animate, transition } from '@angular/animations';


  export const slideFromBelowAnimation =
  trigger('slideFromBelow', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(100%)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'translateY(0)' })) 
    ]),
    transition(':leave', [
      animate('1s ease-out', style({ opacity: 0, transform: 'translateY(100%)' })) 
    ])
  ]);

  export const slideFromLeftAnimation =
  trigger('slideFromLeft', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateX(-100%)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ]),
    transition(':leave', [
      animate('1s ease-out', style({ opacity: 0, transform: 'translateX(100%)' })) 
    ])
  ]);

  export const fade = trigger('fade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('1s ease-out', style({ opacity: 1 })) 
    ]),
    transition(':leave', [
      animate('1s ease-out', style({ opacity: 0 }))
    ])
  ]);


  export const routeAnimations = trigger('routeAnimations', [
    transition('home <=> login', [
      style({ opacity: 0, transform: 'scale(0.96)', filter: 'blur(6px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('home <=> registerHome', [
      style({ opacity: 0, transform: 'scale(0.97) rotateX(6deg)', filter: 'blur(4px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('home <=> patientHome', [
      style({ opacity: 0, transform: 'scale(0.95)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('home <=> adminHome', [
      style({ opacity: 0, transform: 'scale(0.98) rotateX(-5deg)', filter: 'blur(4px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('home <=> registerPaciente', [
      style({ opacity: 0, transform: 'scale(0.94)', filter: 'blur(7px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('home <=> registerEspecialista', [
      style({ opacity: 0, transform: 'scale(0.97) rotateX(4deg)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('patientHome <=> patientProfile', [
      style({ opacity: 0, transform: 'scale(0.96)', filter: 'blur(4px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('patientHome <=> patientAppointments', [
      style({ opacity: 0, transform: 'scale(0.95) rotateX(4deg)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('patientHome <=> patientBooking', [
      style({ opacity: 0, transform: 'scale(0.94)', filter: 'blur(6px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('patientHome <=> patientHistory', [
      style({ opacity: 0, transform: 'scale(0.96) rotateX(-4deg)', filter: 'blur(4px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('specialistAppointments <=> specialistPatients', [
      style({ opacity: 0, transform: 'scale(0.95)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('specialistAppointments <=> specialistProfile', [
      style({ opacity: 0, transform: 'scale(0.97) rotateX(5deg)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('adminHome <=> adminProfile', [
      style({ opacity: 0, transform: 'scale(0.96) rotateY(-6deg)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateY(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('adminHome <=> adminAppointments', [
      style({ opacity: 0, transform: 'scale(0.95)', filter: 'blur(6px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('adminHome <=> adminReports', [
      style({ opacity: 0, transform: 'scale(0.94) rotateX(6deg)', filter: 'blur(7px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('login <=> registerPaciente', [
      style({ opacity: 0, transform: 'scale(0.95)', filter: 'blur(6px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ]),
    transition('login <=> registerEspecialista', [
      style({ opacity: 0, transform: 'scale(0.97) rotateX(-5deg)', filter: 'blur(5px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1) rotateX(0deg)', filter: 'blur(0px)' }))
    ]),
    transition('* <=> *', [
      style({ opacity: 0, transform: 'scale(0.97)', filter: 'blur(4px)' }),
      animate('1s ease-out', style({ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }))
    ])
  ])
  
