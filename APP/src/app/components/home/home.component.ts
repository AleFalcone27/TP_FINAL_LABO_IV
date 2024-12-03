import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { slideFromLeftAnimation } from '../../animations/animations';
import { slideFromBelowAnimation } from '../../animations/animations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  animations: [slideFromLeftAnimation,slideFromBelowAnimation]
})
export class HomeComponent {

}
