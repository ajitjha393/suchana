import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Notification, NotificationType } from '../types/notification';
import { NotificationApiService } from '../core/api/notification-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
};

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly state$ = new BehaviorSubject<State>(initialState);
  private readonly snack = inject(MatSnackBar);

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
}
