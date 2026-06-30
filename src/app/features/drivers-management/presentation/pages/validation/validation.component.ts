import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DriversPanelState } from '../../state/drivers-panel.state';
import { DriverDocumentDTO } from '../../../data/models/driver-panel.dto';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  providers: [DriversPanelState],
  templateUrl: './validation.component.html',
})
export class ValidationComponent implements OnInit {
  rejectReason = '';

  constructor(public state: DriversPanelState) {}

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
}
