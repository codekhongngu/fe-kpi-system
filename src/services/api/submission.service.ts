import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubmissionApiService {
  private baseUrl = environment.apiUrl + '/submissions';

  constructor(private http: HttpClient) {}

  // ... existing methods ...
  
  // Two-level approval methods
  approveDepartment(submissionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${submissionId}/approve-department`, {});
  }

  rejectDepartment(submissionId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${submissionId}/reject-department`, { reason });
  }

  approveDistrict(submissionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${submissionId}/approve-district`, {});
  }

  rejectDistrict(submissionId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${submissionId}/reject-district`, { reason });
  }

  // Query methods for different approval levels
  getPendingDepartment(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/pending-department`, { params: httpParams });
  }

  getDepartmentApproved(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/department-approved`, { params: httpParams });
  }

  getPendingDistrict(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/pending-district`, { params: httpParams });
  }

  // Version management methods
  getSubmissionHistory(assignmentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/history/${assignmentId}`);
  }

  compareVersions(version1Id: string, version2Id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/compare`, { version1Id, version2Id });
  }

  downloadVersion(submissionId: string, format: 'pdf' | 'excel' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${submissionId}/download`, {
      params: { format },
      responseType: 'blob'
    });
  }
}
