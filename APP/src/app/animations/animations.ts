import { trigger, group, style, animate, transition, query, animateChild,  } from '@angular/animations';


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
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(100%)' }),
      animate('0.7s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ]),
    transition(':leave', [
      animate('0.7s ease-out', style({ opacity: 0, transform: 'translateY(-100%)' }))
    ])
  ])
  