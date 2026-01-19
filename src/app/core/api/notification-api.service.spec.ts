import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NotificationApiService } from './notification-api.service';
import { environment } from '../../../environments/environment';

import { Notification } from '../../types/notification';
import { GetNotificationsQuery, PagedResponse } from '../../types/paged-response';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiBaseUrl; // '/api'

  const makeNotification = (id: string, read: boolean): Notification => ({
    id,
    title: `Title ${id}`,
    message: `Message ${id}`,
    type: 'info',
    timestamp: new Date(2026, 0, 1).toISOString(),
    read,
    category: 'general',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationApiService],
    });

    service = TestBed.inject(NotificationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getNotifications', () => {
    it('should call GET /notifications with page and pageSize params', () => {
      const q: GetNotificationsQuery = { page: 2, pageSize: 10, type: 'all', search: '' };

      const mockResp: PagedResponse<Notification> = {
        items: [makeNotification('1', false)],
        total: 1,
        page: 2,
        pageSize: 10,
      };

      service.getNotifications(q).subscribe(res => expect(res).toEqual(mockResp));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${baseUrl}/notifications`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('10');
      expect(req.request.params.has('type')).toBeFalse();
      expect(req.request.params.has('search')).toBeFalse();

      req.flush(mockResp);
    });

    it('should include type param when type != all', () => {
      const q: GetNotificationsQuery = { page: 1, pageSize: 5, type: 'warning' };

      const mockResp: PagedResponse<Notification> = { items: [], total: 0, page: 1, pageSize: 5 };

      service.getNotifications(q).subscribe(res => expect(res).toEqual(mockResp));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${baseUrl}/notifications`);
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('5');
      expect(req.request.params.get('type')).toBe('warning');

      req.flush(mockResp);
    });

    it('should include trimmed search param when provided', () => {
      const q: GetNotificationsQuery = { page: 1, pageSize: 5, type: 'all', search: '   hello world   ' };

      const mockResp: PagedResponse<Notification> = { items: [], total: 0, page: 1, pageSize: 5 };

      service.getNotifications(q).subscribe(res => expect(res).toEqual(mockResp));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${baseUrl}/notifications`);
      expect(req.request.params.get('search')).toBe('hello world');

      req.flush(mockResp);
    });

    it('should NOT include search param when search is only whitespace', () => {
      const q: GetNotificationsQuery = { page: 1, pageSize: 5, type: 'all', search: '    ' };

      const mockResp: PagedResponse<Notification> = { items: [], total: 0, page: 1, pageSize: 5 };

      service.getNotifications(q).subscribe(res => expect(res).toEqual(mockResp));

      const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${baseUrl}/notifications`);
      expect(req.request.params.has('search')).toBeFalse();

      req.flush(mockResp);
    });
  });

  it('setRead should PATCH /notifications/:id/read with { read }', () => {
    const id = 'abc';
    const mockNotif: Notification = makeNotification(id, true);

    service.setRead(id, true).subscribe(res => expect(res).toEqual(mockNotif));

    const req = httpMock.expectOne(`${baseUrl}/notifications/${id}/read`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ read: true });

    req.flush(mockNotif);
  });

  it('delete should DELETE /notifications/:id', () => {
    const id = 'n1';

    service.delete(id).subscribe(res => expect(res).toEqual({ ok: true }));

    const req = httpMock.expectOne(`${baseUrl}/notifications/${id}`);
    expect(req.request.method).toBe('DELETE');

    req.flush({ ok: true });
  });

  it('unreadCount should GET /notifications/unread/count', () => {
    service.unreadCount().subscribe(res => expect(res).toEqual({ count: 7 }));

    const req = httpMock.expectOne(`${baseUrl}/notifications/unread/count`);
    expect(req.request.method).toBe('GET');

    req.flush({ count: 7 });
  });

  it('bulkSetRead should PATCH /notifications/read with { ids, read }', () => {
    const ids = ['1', '2', '3'];

    service.bulkSetRead(ids, false).subscribe(res => expect(res).toEqual({ ok: true, updated: 3 }));

    const req = httpMock.expectOne(`${baseUrl}/notifications/read`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ids, read: false });

    req.flush({ ok: true, updated: 3 });
  });

  it('bulkDelete should send DELETE to /notifications with body { ids }', () => {
    const ids = ['a', 'b'];

    service.bulkDelete(ids).subscribe(res => expect(res).toEqual({ ok: true, deleted: 2 }));

    const req = httpMock.expectOne(`${baseUrl}/notifications`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ ids });

    req.flush({ ok: true, deleted: 2 });
  });

  it('deleteAll should DELETE /notifications/delete-all', () => {
    service.deleteAll().subscribe(res => expect(res).toEqual({ ok: true, deleted: 99 }));

    const req = httpMock.expectOne(`${baseUrl}/notifications/delete-all`);
    expect(req.request.method).toBe('DELETE');

    req.flush({ ok: true, deleted: 99 });
  });
});
