import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { ImageLightboxComponent } from './shared/image-lightbox/image-lightbox.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ImageLightboxComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly theme = inject(ThemeService);
}
