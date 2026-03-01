import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavigationComponent } from './shared/components/navigation/navigation';
import { TimerWidgetComponent } from './shared/components/timer-widget/timer-widget.component';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent, TimerWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('b-mad-project');
  private readonly router = inject(Router);

  protected readonly showNavigation = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => !['login', 'register'].some(p => (e as NavigationEnd).urlAfterRedirects.startsWith('/' + p)))
    ),
    { initialValue: true }
  );
}
