import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationStore } from './notification.store';
import { NotificationApiService } from '../core/api/notification-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '../core/logging/logger.service';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

import { Notification, NotificationType } from '../types/notification';

describe('NotificationStore', () => {
  let store: NotificationStore;
  let api: jasmine.SpyObj<NotificationApiService>;
  let snack: jasmine.SpyObj<MatSnackBar>;
  let logger: jasmine.SpyObj<LoggerService>;

  const n1: Notification = { id: '1', read: false } as any;
  const n2: Notification = { id: '2', read: true } as any;
  const n3: Notification = { id: '3', read: false } as any;

  const pageResponse = {
    items: [n1, n2, n3],
    total: 3,
    page: 1,
    pageSize: 5,
  };

  beforeEach(() => {
    api = jasmine.createSpyObj<NotificationApiService>('NotificationApiService', [
      'getNotifications',
      'unreadCount',
      'setRead',
      'delete',
      'bulkSetRead',
      'bulkDelete',
      'deleteAll',
    ]);

    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        NotificationStore,
        { provide: NotificationApiService, useValue: api },
        { provide: MatSnackBar, useValue: snack },
        { provide: LoggerService, useValue: logger },
      ],
    });

    store = TestBed.inject(NotificationStore);

  });

  function getStateOnce(): any {
    let snapshot: any;
    store.vm$.pipe(take(1)).subscribe(s => (snapshot = s));
    return snapshot;
  }

  it('init() should load list and refresh unread count', () => {
    api.unreadCount.and.returnValue(of({ count: 10 } as any));
    api.getNotifications.and.returnValue(of(pageResponse as any));

    store.init();

    expect(api.unreadCount).toHaveBeenCalled();
    expect(api.getNotifications).toHaveBeenCalled();

    const s = getStateOnce();
    expect(s.items.length).toBe(3);
    expect(s.total).toBe(3);
    expect(s.page).toBe(1);
    expect(s.pageSize).toBe(5);
    // unreadCount is max(global count, current page unread) in patchUnreadFromList()
    expect(s.unreadCount).toBe(10);
    expect(s.loading).toBeFalse();
    expect(s.error).toBeNull();
  });

  it('setType() should patch type, reset page, and reload', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));

    store.setType('all' as NotificationType);

    const s = getStateOnce();
    expect(s.type).toBe('all');
    expect(s.page).toBe(1);
    expect(api.getNotifications).toHaveBeenCalled();
  });

  it('setPage() should patch paging and reload', () => {
    api.getNotifications.and.returnValue(of({ ...pageResponse, page: 2, pageSize: 20 } as any));

    store.setPage(2, 20);

    const s = getStateOnce();
    expect(s.page).toBe(2);
    expect(s.pageSize).toBe(20);
    expect(api.getNotifications).toHaveBeenCalled();
  });


  it('load() should set error on failure and stop loading', () => {
    api.getNotifications.and.returnValue(throwError(() => new Error('boom')));

    store.retry();

    const s = getStateOnce();
    expect(s.error).toBe('Failed to load notifications. Please try again.');
    expect(s.loading).toBeFalse();
  });

  it('toggleRead() should optimistically update read, then call api.setRead()', () => {
    // prime store with items
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.setRead.and.returnValue(of({} as any));
    api.unreadCount.calls.reset();

    const before = getStateOnce();
    const target = before.items.find((x: any) => x.id === '1');
    expect(target.read).toBeFalse();

    store.toggleRead(target);

    const after = getStateOnce();
    const updated = after.items.find((x: any) => x.id === '1');
    expect(updated.read).toBeTrue();
    expect(api.setRead).toHaveBeenCalledWith('1', true);
    expect(api.unreadCount).toHaveBeenCalled(); // refreshUnreadCount
  });

  it('toggleRead() should rollback on api error and show snack', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.setRead.and.returnValue(throwError(() => new Error('nope')));

    const target = getStateOnce().items.find((x: any) => x.id === '1');
    store.toggleRead(target);

    const s = getStateOnce();
    const rolledBack = s.items.find((x: any) => x.id === '1');
    expect(rolledBack.read).toBeFalse();
    expect(snack.open).toHaveBeenCalled();
  });

  it('delete() should optimistically remove item and decrement total, then call api.delete()', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.delete.and.returnValue(of({} as any));

    const target = getStateOnce().items.find((x: any) => x.id === '1');
    store.delete(target);

    const s = getStateOnce();
    expect(s.items.some((x: any) => x.id === '1')).toBeFalse();
    expect(s.total).toBe(2);
    expect(api.delete).toHaveBeenCalledWith('1');
    expect(snack.open).toHaveBeenCalledWith('Notification deleted', 'Dismiss', { duration: 2000 });
  });

  it('delete() should rollback on api error, log error, and show snack', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.delete.and.returnValue(throwError(() => new Error('nope')));

    const target = getStateOnce().items.find((x: any) => x.id === '1');
    store.delete(target);

    const s = getStateOnce();
    expect(s.items.some((x: any) => x.id === '1')).toBeTrue();
    expect(logger.error).toHaveBeenCalled();
    expect(snack.open).toHaveBeenCalledWith('Failed to delete notification. Please try again.', 'Dismiss', { duration: 3000 });
  });

  it('selection helpers: toggleSelected(), selectAllOnPage(), clearSelection()', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    store.retry(); // loads list

    store.toggleSelected('1', true);
    store.toggleSelected('2', true);

    let s = getStateOnce();
    expect(store.selectedCount()).toBe(2);
    expect(store.isSelected('1')).toBeTrue();
    expect(store.isSelected('3')).toBeFalse();

    store.selectAllOnPage(true);
    s = getStateOnce();
    expect(store.selectedCount()).toBe(3);
    expect(store.isAllSelectedOnPage()).toBeTrue();
    expect(store.isAnySelectedOnPage()).toBeTrue();

    store.selectAllOnPage(false);
    expect(store.selectedCount()).toBe(0);

    store.toggleSelected('1', true);
    store.clearSelection();
    expect(store.selectedCount()).toBe(0);
  });

  it('bulkMarkRead(read=true) should optimistically update selected and call api.bulkSetRead; then clear selection', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.bulkSetRead.and.returnValue(of({} as any));
    api.unreadCount.calls.reset();

    store.toggleSelected('1', true);
    store.toggleSelected('3', true);

    store.bulkMarkRead(true);

    const s = getStateOnce();
    expect(s.items.find((x: any) => x.id === '1')?.read).toBeTrue();
    expect(s.items.find((x: any) => x.id === '3')?.read).toBeTrue();
    expect(api.bulkSetRead).toHaveBeenCalledWith(['1', '3'], true);
    expect(store.selectedCount()).toBe(0);
    expect(api.unreadCount).toHaveBeenCalled();
  });

  it('bulkMarkRead() should show snack and reload on error', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.bulkSetRead.and.returnValue(throwError(() => new Error('nope')));
    api.getNotifications.and.returnValue(of(pageResponse as any));

    store.toggleSelected('1', true);
    store.bulkMarkRead(true);

    expect(snack.open).toHaveBeenCalledWith('Bulk update failed. Please try again.', 'Dismiss', { duration: 3000 });
    expect(api.getNotifications).toHaveBeenCalled();
  });

  it('bulkDeleteSelected() should optimistically remove selected and call api.bulkDelete, then reload', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    api.unreadCount.and.returnValue(of({ count: 2 } as any));
    store.init();

    api.bulkDelete.and.returnValue(of({} as any));
    // reload
    api.getNotifications.and.returnValue(of(pageResponse as any));

    store.toggleSelected('1', true);
    store.toggleSelected('3', true);

    store.bulkDeleteSelected();

    expect(api.bulkDelete).toHaveBeenCalledWith(['1', '3']);
    expect(snack.open).toHaveBeenCalledWith('Selected notifications deleted', 'Dismiss', { duration: 2000 });
    expect(api.getNotifications).toHaveBeenCalled(); // reload
    expect(store.selectedCount()).toBe(0);
  });

  it('bulkDeleteSelected() should rollback on error and show snack', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    store.retry();

    api.bulkDelete.and.returnValue(throwError(() => new Error('nope')));

    store.toggleSelected('1', true);
    store.bulkDeleteSelected();

    const s = getStateOnce();
    expect(s.items.some((x: any) => x.id === '1')).toBeTrue();
    expect(snack.open).toHaveBeenCalledWith('Bulk delete failed. Please try again.', 'Dismiss', { duration: 3000 });
  });

  it('deleteAll() should call api.deleteAll and reset store list', () => {
    api.getNotifications.and.returnValue(of(pageResponse as any));
    store.retry();

    api.deleteAll.and.returnValue(of({} as any));
    api.unreadCount.and.returnValue(of({ count: 0 } as any));

    store.deleteAll();

    const s = getStateOnce();
    expect(api.deleteAll).toHaveBeenCalled();
    expect(s.items).toEqual([]);
    expect(s.total).toBe(0);
    expect(s.page).toBe(1);
    expect(snack.open).toHaveBeenCalledWith('All notifications deleted', 'Dismiss', { duration: 2000 });
  });
});
