import { createAction, props } from '@ngrx/store';

export const loadActiveSubmission = createAction(
  '[Submission] Load Active Submission',
  props<{ assignmentId: string }>()
);

export const loadActiveSubmissionSuccess = createAction(
  '[Submission] Load Active Submission Success',
  props<{ submission: any }>()
);

export const loadSubmissionHistory = createAction(
  '[Submission] Load History',
  props<{ assignmentId: string }>()
);

export const loadSubmissionHistorySuccess = createAction(
  '[Submission] Load History Success',
  props<{ history: any[] }>()
);

export const approveDepartmentSubmission = createAction(
  '[Submission] Approve Department',
  props<{ submissionId: string }>()
);

export const approveDepartmentSubmissionSuccess = createAction(
  '[Submission] Approve Department Success',
  props<{ submission: any }>()
);

export const rejectDepartmentSubmission = createAction(
  '[Submission] Reject Department',
  props<{ submissionId: string, reason: string }>()
);

export const rejectDepartmentSubmissionSuccess = createAction(
  '[Submission] Reject Department Success',
  props<{ submission: any }>()
);

export const approveDistrictSubmission = createAction(
  '[Submission] Approve District',
  props<{ submissionId: string }>()
);

export const approveDistrictSubmissionSuccess = createAction(
  '[Submission] Approve District Success',
  props<{ submission: any }>()
);

export const rejectDistrictSubmission = createAction(
  '[Submission] Reject District',
  props<{ submissionId: string, reason: string }>()
);

export const rejectDistrictSubmissionSuccess = createAction(
  '[Submission] Reject District Success',
  props<{ submission: any }>()
);

export const loadPendingDepartment = createAction(
  '[Submission] Load Pending Department',
  props<{ params?: any }>()
);

export const loadPendingDepartmentSuccess = createAction(
  '[Submission] Load Pending Department Success',
  props<{ submissions: any[] }>()
);

export const loadPendingDistrict = createAction(
  '[Submission] Load Pending District',
  props<{ params?: any }>()
);

export const loadPendingDistrictSuccess = createAction(
  '[Submission] Load Pending District Success',
  props<{ submissions: any[] }>()
);

export const compareSubmissionVersions = createAction(
  '[Submission] Compare Versions',
  props<{ version1Id: string, version2Id: string }>()
);

export const compareSubmissionVersionsSuccess = createAction(
  '[Submission] Compare Versions Success',
  props<{ comparison: any }>()
);
