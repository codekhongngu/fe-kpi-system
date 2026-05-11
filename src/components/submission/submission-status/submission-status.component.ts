import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-submission-status',
  templateUrl: './submission-status.component.html',
  styleUrls: ['./submission-status.component.scss']
})
export class SubmissionStatusComponent implements OnInit {
  @Input() submission: any;

  statusConfig = {
    'DRAFT': { text: 'Bản nháp', icon: 'edit', class: 'secondary' },
    'PENDING_DEPARTMENT': { text: 'Chờ duyệt phòng ban', icon: 'clock', class: 'warning' },
    'DEPARTMENT_APPROVED': { text: 'Đã duyệt phòng ban', icon: 'check-circle', class: 'info' },
    'PENDING_DISTRICT': { text: 'Chờ duyệt cấp xã', icon: 'clock', class: 'warning' },
    'DISTRICT_APPROVED': { text: 'Đã duyệt cấp xã', icon: 'check-circle', class: 'success' },
    'REJECTED_DEPARTMENT': { text: 'Bị từ chối phòng ban', icon: 'x-circle', class: 'danger' },
    'REJECTED_DISTRICT': { text: 'Bị từ chối cấp xã', icon: 'x-circle', class: 'danger' },
    'APPROVED': { text: 'Đã duyệt', icon: 'check-circle', class: 'success' },
    'REJECTED': { text: 'Bị từ chối', icon: 'x-circle', class: 'danger' }
  };

  ngOnInit() {
    // Component initialization logic
  }

  getStatusConfig() {
    return this.statusConfig[this.submission.status] || 
           { text: this.submission.status, icon: 'help', class: 'secondary' };
  }

  canShowApprovalActions() {
    return ['PENDING_DEPARTMENT', 'PENDING_DISTRICT'].includes(this.submission.status);
  }

  canShowResubmit() {
    return ['REJECTED_DEPARTMENT', 'REJECTED_DISTRICT'].includes(this.submission.status);
  }

  getApprovalInfo() {
    if (this.submission.status === 'DEPARTMENT_APPROVED') {
      return {
        approver: this.submission.departmentApprovedByName,
        approvedAt: this.submission.departmentApprovedAt,
        level: 'Phòng ban'
      };
    }
    
    if (this.submission.status === 'DISTRICT_APPROVED') {
      return {
        approver: this.submission.districtApprovedByName,
        approvedAt: this.submission.districtApprovedAt,
        level: 'Cấp xã'
      };
    }
    
    return null;
  }
}
