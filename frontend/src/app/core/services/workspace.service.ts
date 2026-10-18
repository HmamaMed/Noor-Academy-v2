import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Material, MaterialRequest, Workspace } from '../models/material.model';
export interface AttachmentDownload { url: string; expiresAt: string; }
@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private url(groupId: number) {
    return `${environment.apiUrl}/workspaces/${groupId}`;
  }
  find(groupId: number) {
    return this.http.get<Workspace>(this.url(groupId));
  }
  create(groupId: number, request: MaterialRequest, file: File | null) {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) form.append('file', file);
    return this.http.post<Material>(`${this.url(groupId)}/materials`, form);
  }
  delete(groupId: number, id: number) {
    return this.http.delete<void>(`${this.url(groupId)}/materials/${id}`);
  }
  download(groupId: number, id: number) {
    const url = `${this.url(groupId)}/materials/${id}`;
    return this.http.get<AttachmentDownload>(`${url}/download`);
  }
}
