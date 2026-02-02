import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/components/navigation/navigation';
import { TimerWidgetComponent } from './shared/components/timer-widget/timer-widget.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, TimerWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('b-mad-project');
}
