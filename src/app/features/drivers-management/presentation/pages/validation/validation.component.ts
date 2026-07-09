import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DriversPanelState } from '../../state/drivers-panel.state';
import { DriverDocumentDTO } from '../../../data/models/driver-panel.dto';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  providers: [DriversPanelState],
  templateUrl: './validation.component.html',
})
export class ValidationComponent implements OnInit {
  readonly state = inject(DriversPanelState);
  readonly session = inject(AuthSessionService);

  rejectReason = '';

  // Signal for simple document/profile image modal expansion
  readonly activeModalImage = signal<string | null>(null);

  // Signals for vehicle image carousel modal
  readonly carImagesModalList = signal<string[]>([]);
  readonly carImagesModalIndex = signal<number>(0);

  ngOnInit(): void {
    this.state.loadPendingDrivers();
  }

  rejectSelectedDriver(): void {
    this.state.rejectSelectedDriver(this.rejectReason);
    this.rejectReason = '';
  }

  getDocumentByType(typeId: number): DriverDocumentDTO | undefined {
    return this.state
      .selectedDriver()
      ?.documents.find((document) => document.id_document_type === typeId);
  }

  getSelectedDriverStatus(): 'pending' | 'approved' | 'rejected' | undefined {
    const selected = this.state.selectedDriver();
    if (!selected) return undefined;
    return this.state.allDrivers().find((d) => d.id_user === selected.id_user)?.status;
  }

  openCarCarousel(car: any, startIndex: number = 0): void {
    if (!car) return;
    const images: string[] = [];
    if (car.frontview_image) images.push(car.frontview_image);
    if (car.leftview_image) images.push(car.leftview_image);
    if (car.rightview_image) images.push(car.rightview_image);
    if (car.backview_image) images.push(car.backview_image);
    if (car.space_image) images.push(car.space_image);
    this.carImagesModalList.set(images);
    this.carImagesModalIndex.set(startIndex);
  }

  nextCarImage(event: Event): void {
    event.stopPropagation();
    const list = this.carImagesModalList();
    if (list.length === 0) return;
    this.carImagesModalIndex.update((idx) => (idx + 1) % list.length);
  }

  prevCarImage(event: Event): void {
    event.stopPropagation();
    const list = this.carImagesModalList();
    if (list.length === 0) return;
    this.carImagesModalIndex.update((idx) => (idx - 1 + list.length) % list.length);
  }
}
