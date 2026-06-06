import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { slideFromBelowAnimation } from '../../animations/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [slideFromBelowAnimation]
})
export class HomeComponent {

}
