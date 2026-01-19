import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../../types/notification';
import { PagedResponse, GetNotificationsQuery  } from '../../types/paged-response';
import { environment } from '../../../environments/environment';


@Injectable({ 
    providedIn: 'root'
})
export class NotificationApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getNotifications(q: GetNotificationsQuery): Observable<PagedResponse<Notification>> {
    let params = new HttpParams()
      .set('page', q.page)
      .set('pageSize', q.pageSize);

    if (q.type && q.type !== 'all') params = params.set('type', q.type);
    if (q.search?.trim()) params = params.set('search', q.search.trim());

    return this.http.get<PagedResponse<Notification>>(`${this.baseUrl}/notifications`, { params });
  }

  setRead(id: string, read: boolean): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/notifications/${id}/read`, { read });
  }

  delete(id: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.baseUrl}/notifications/${id}`);
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/notifications/unread/count`);
  }

  bulkSetRead(ids: string[], read: boolean) {
    return this.http.patch<{ ok: true; updated: number }>(
      `${this.baseUrl}/notifications/read`,
      { ids, read }
    );
  }

  bulkDelete(ids: string[]) {
    return this.http.request<{ ok: true; deleted: number }>(
      'delete',
      `${this.baseUrl}/notifications`,
      { body: { ids } }
    );
  }

  deleteAll() {
    return this.http.delete<{ ok: true; deleted: number }>(
      `${this.baseUrl}/notifications/delete-all`
    );
  }

  getStreamUrl(): string {
    return `${this.baseUrl}/notifications/stream`;
  }

}
