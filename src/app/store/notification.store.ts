import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Notification, NotificationType } from '../types/notification';
import { NotificationApiService } from '../core/api/notification-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationStreamService } from '../core/services/notifcation-stream.service';

interface State {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;

  type: NotificationType | 'all';
  search: string;

  unreadCount: number;

  loading: boolean;
  error: string | null;
  selectedIds: Record<string, boolean>;
}

const initialState: State = {
  items: [],
  page: 1,
  pageSize: 5,
  total: 0,

  type: 'all',
  search: '',

  unreadCount: 0,

  loading: false,
  error: null,
  selectedIds: {},
};

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly state$ = new BehaviorSubject<State>(initialState);
  private readonly snack = inject(MatSnackBar);
  private readonly stream = inject(NotificationStreamService);

  // Public selectors vm -> ViewModel provides steam of data that Ui template needs
  readonly vm$ = this.state$.asObservable();

  // Internal search stream for debounce
  private readonly search$ = new BehaviorSubject<string>('');

  constructor(private api: NotificationApiService) {
    // Debounced search → reload list
    this.search$
      .pipe(
        debounceTime(300),
        map(v => v.trim()),
        distinctUntilChanged(),
        tap(search => this.patch({ search, page: 1 })),
        switchMap(() => this.load())
      )
      .subscribe();
  }

  init(): void {
    this.refreshUnreadCount();
    this.load().subscribe();
  }

  setType(type: NotificationType | 'all'): void {
    this.patch({ type, page: 1 });
    this.load().subscribe();
  }

  setSearch(search: string): void {
    this.search$.next(search);
  }

  setPage(page: number, pageSize: number): void {
    this.patch({ page, pageSize });
    this.load().subscribe();
  }

  toggleRead(n: Notification): void {
    // Optimistic update
    const nextRead = !n.read;
    this.patch({
      items: this.state$.value.items.map(x => (x.id === n.id ? { ...x, read: nextRead } : x)),
    });
    this.patchUnreadFromList();

    this.api.setRead(n.id, nextRead).pipe(
      tap(() => this.refreshUnreadCount()),
      catchError(err => {
        // rollback
        this.patch({
          items: this.state$.value.items.map(x => (x.id === n.id ? { ...x, read: n.read } : x)),
        });
        this.patchUnreadFromList();
        this.snack.open('Failed to update read status. Please try again.', 'Dismiss', { duration: 3000 });
        return of(null);
      })
    ).subscribe();
  }

  delete(n: Notification): void {
    const prevItems = this.state$.value.items;
    const nextItems = prevItems.filter(x => x.id !== n.id);
    this.patch({ items: nextItems, total: Math.max(0, this.state$.value.total - 1) });
    this.patchUnreadFromList();

    this.api.delete(n.id).pipe(
      tap(() => {
        this.snack.open('Notification deleted', 'Dismiss', { duration: 2000 });
        this.refreshUnreadCount();
        // If page became empty and not first page, go back one page
        if (this.state$.value.items.length === 0 && this.state$.value.page > 1) {
          this.patch({ page: this.state$.value.page - 1 });
          this.load().subscribe();
        }
      }),
      catchError(err => {
        // rollback so that consistency is maintained
        this.patch({ items: prevItems, total: this.state$.value.total + 1 });
        this.patchUnreadFromList();
        this.snack.open('Failed to delete notification. Please try again.', 'Dismiss', { duration: 3000 });
        return of(null);
      })
    ).subscribe();
  }

  retry(): void {
    this.load().subscribe();
  }

  private load() {
    const s = this.state$.value;
    this.patch({ loading: true, error: null });

    return this.api.getNotifications({
      page: s.page,
      pageSize: s.pageSize,
      type: s.type,
      search: s.search,
    }).pipe(
      tap(res => this.patch({ items: res.items, total: res.total, page: res.page, pageSize: res.pageSize })),
      tap(() => this.patchUnreadFromList()),
      catchError(err => {
        this.patch({ error: 'Failed to load notifications. Please try again.' });
        return of(null);
      }),
      finalize(() => this.patch({ loading: false }))
    );
  }

  private refreshUnreadCount(): void {
    this.api.unreadCount().pipe(
      tap(res => this.patch({ unreadCount: res.count })),
      catchError(() => of(null))
    ).subscribe();
  }

  private patchUnreadFromList(): void {
    // Keeps the toolbar reactive even before count endpoint refresh completes
    const count = this.state$.value.items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
    // This is our "current page unread". The API count refresh keeps global truth.
    this.patch({ unreadCount: Math.max(this.state$.value.unreadCount, count) });
  }

  private patch(p: Partial<State>): void {
    this.state$.next({ ...this.state$.value, ...p });
  }

  toggleSelected(id: string, checked: boolean): void {
    const next = { ...this.state$.value.selectedIds };
    if (checked) next[id] = true;
    else delete next[id];
    this.patch({ selectedIds: next });
  }

  clearSelection(): void {
    this.patch({ selectedIds: {} });
  }

  selectAllOnPage(checked: boolean): void {
    const next = { ...this.state$.value.selectedIds };
    for (const n of this.state$.value.items) {
      if (checked) next[n.id] = true;
      else delete next[n.id];
    }
    this.patch({ selectedIds: next });
  }

  selectedCount(): number {
    return Object.keys(this.state$.value.selectedIds).length;
  }

  selectedIdsList(): string[] {
    return Object.keys(this.state$.value.selectedIds);
  }

  isSelected(id: string): boolean {
    return !!this.state$.value.selectedIds[id];
  }

  bulkMarkRead(read: boolean): void {
  const ids = this.selectedIdsList();
  if (ids.length === 0) return;

  // update on current page
  const nextItems = this.state$.value.items.map(n =>
    ids.includes(n.id) ? { ...n, read } : n
  );
  this.patch({ items: nextItems });

  this.api.bulkSetRead(ids, read).pipe(
    tap(() => {
      this.refreshUnreadCount();
      this.clearSelection();
    }),
    catchError(() => {
      this.snack.open('Bulk update failed. Please try again.', 'Dismiss', { duration: 3000 });
      // reload to restore correctness
      return this.load();
    })
  ).subscribe();
}

  bulkDeleteSelected(): void {
    const ids = this.selectedIdsList();
    if (ids.length === 0) return;

    const prevItems = this.state$.value.items;
    const nextItems = prevItems.filter(n => !ids.includes(n.id));

    // optimistic remove (page-only)
    this.patch({ items: nextItems });

    this.api.bulkDelete(ids).pipe(
      tap(() => {
        this.snack.open('Selected notifications deleted', 'Dismiss', { duration: 2000 });
        this.refreshUnreadCount();
        this.clearSelection();
        // reload to get correct totals + fill page
        this.load().subscribe();
      }),
      catchError(() => {
        this.patch({ items: prevItems });
        this.snack.open('Bulk delete failed. Please try again.', 'Dismiss', { duration: 3000 });
        return of(null);
      })
    ).subscribe();
  }


  deleteAll(): void {
      this.api.deleteAll().pipe(
        tap(() => {
          this.snack.open('All notifications deleted', 'Dismiss', { duration: 2000 });
          this.clearSelection();
          this.patch({ items: [], total: 0, page: 1 });
          this.refreshUnreadCount();
        }),
        catchError(() => {
          this.snack.open('Delete all failed. Please try again.', 'Dismiss', { duration: 3000 });
          return of(null);
        })
      ).subscribe();
    }


  isAllSelectedOnPage(): boolean {
    const items = this.state$.value.items;
    if (items.length === 0) return false;

    return items.every(n => this.state$.value.selectedIds[n.id]);
  }

  isAnySelectedOnPage(): boolean {
    return this.state$.value.items.some(n => this.state$.value.selectedIds[n.id]);
  }

  startRealtime(): void {
  
  const streamUrl = this.api.getStreamUrl();
  this.stream.connect(streamUrl).subscribe({
    next: (evt) => {
      // Handle different event types as needed in future
      if (evt.type === 'notification_created') {
        // refresh list + count (correct with pagination/filter/search)
        this.refreshUnreadCount();
        this.load().subscribe();
        this.snack.open('New notification received', 'Dismiss', { duration: 2000 });
      }
    },
    error: () => {
      console.log('Notification stream disconnected');
      this.snack.open('Real-time notification connection lost.', 'Dismiss', { duration: 3000 });
    },
  });
}

}
