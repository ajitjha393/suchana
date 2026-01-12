import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../../types/notification';
import { PagedResponse, GetNotificationsQuery  } from '../../types/paged-response';


@Injectable({ 
    providedIn: 'root'
})
export class NotificationApiService {
  private readonly baseUrl = 'http://localhost:4000/api';

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
}
