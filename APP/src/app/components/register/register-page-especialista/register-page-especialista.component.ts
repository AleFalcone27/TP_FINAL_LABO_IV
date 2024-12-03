import { Component } from '@angular/core';
import { RegisterEspecialistaComponent } from '../register-especialista/register-especialista.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { fade } from '../../../animations/animations';

@Component({
  selector: 'app-register-page-especialista',
  standalone: true,
  imports: [RegisterEspecialistaComponent, SidebarComponent],
  templateUrl: './register-page-especialista.component.html',
  styleUrl: './register-page-especialista.component.css',
  animations: [fade]
})
export class RegisterPageEspecialistaComponent {

}
