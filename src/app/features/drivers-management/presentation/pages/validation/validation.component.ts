import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DriversPanelState } from '../../state/drivers-panel.state';
import { DriverDocumentDTO, formatBirthdate } from '../../../data/models/driver-panel.dto';
import { AuthSessionService } from '../../../../../core/auth/auth-session.service';
import { API_BASE_URL } from '../../../../../core/config/api.config';
import { NavbarComponent } from '../../../../../core/layout/navbar/navbar.component';
import { PrivateImageComponent } from '../../../../../shared/private-image/private-image.component';
import { ImageLightboxService } from '../../../../../shared/image-lightbox/image-lightbox.service';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, PrivateImageComponent],
  providers: [DriversPanelState],
  templateUrl: './validation.component.html',
})
export class ValidationComponent implements OnInit {
  readonly state = inject(DriversPanelState);
  readonly session = inject(AuthSessionService);
  private readonly lightbox = inject(ImageLightboxService);

  // ── Modal Signals ──────────────────────────────────────────────────
  readonly showApproveConfirmModal = signal<boolean>(false);
  readonly showRejectReasonModal = signal<boolean>(false);
  readonly showRejectConfirmModal = signal<boolean>(false);
  readonly rejectReason = signal<string>('');

  readonly profileDropdownOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.state.loadPendingDrivers();
  }

  // ── Approve Flow (1 step) ──────────────────────────────────────────
  onApproveClick(): void {
    this.showApproveConfirmModal.set(true);
  }

  confirmApprove(): void {
    this.showApproveConfirmModal.set(false);
    this.state.approveSelectedDriver();
  }

  cancelApprove(): void {
    this.showApproveConfirmModal.set(false);
  }

  // ── Reject Flow (2 steps) ─────────────────────────────────────────
  onRejectClick(): void {
    this.rejectReason.set('');
    this.showRejectReasonModal.set(true);
  }

  continueReject(): void {
    if (!this.rejectReason().trim()) {
      return; // Don't proceed without a reason
    }
    this.showRejectReasonModal.set(false);
    this.showRejectConfirmModal.set(true);
  }

  confirmReject(): void {
    this.showRejectConfirmModal.set(false);
    this.state.rejectSelectedDriver(this.rejectReason().trim());
    this.rejectReason.set('');
  }

  cancelReject(): void {
    this.showRejectReasonModal.set(false);
    this.showRejectConfirmModal.set(false);
    this.rejectReason.set('');
  }

  // ── Helpers ────────────────────────────────────────────────────────
  getDocumentByType(typeId: number): DriverDocumentDTO | undefined {
    return this.state
      .selectedDriver()
      ?.documents?.find((document) => document.id_document_type === typeId);
  }

  formatBirthdate(value: string | null | undefined): string {
    return formatBirthdate(value);
  }

  getSelectedDriverStatus(): 'pending' | 'approved' | 'rejected' | 'blocked' | undefined {
    const selected = this.state.selectedDriver();
    if (!selected) return undefined;
    return this.state.allDrivers().find((d) => d.id_user === selected.id_user)?.status;
  }

  readonly apiBaseUrl = API_BASE_URL;

  formatImageUrl(url: string | undefined, fallback: string = ''): string {
    if (!url) return fallback;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const cleanUrl = url.replace(/^\//, '');
    return `${this.apiBaseUrl}/${cleanUrl}`;
  }

  /** Abre el carrete de fotos del vehículo (todas las vistas disponibles) en el visor flotante. */
  openCarCarousel(car: any, startIndex: number = 0): void {
    if (!car) return;
    const images: string[] = [];
    if (car.frontview_image) images.push(this.formatImageUrl(car.frontview_image));
    if (car.leftview_image) images.push(this.formatImageUrl(car.leftview_image));
    if (car.rightview_image) images.push(this.formatImageUrl(car.rightview_image));
    if (car.backview_image) images.push(this.formatImageUrl(car.backview_image));
    if (car.space_image) images.push(this.formatImageUrl(car.space_image));
    if (car.plates_image) images.push(this.formatImageUrl(car.plates_image));
    this.lightbox.open(images, startIndex);
  }

  openProfileImage(url: string | undefined): void {
    if (!url) return;
    this.lightbox.open([url]);
  }
}
