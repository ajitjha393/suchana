import { Component, OnInit } from '@angular/core';
import { NotificationStore } from '../../store/notification.store';
import { NotificationType } from '../../types/notification';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss'],
})
export class NotificationsPageComponent implements OnInit {
  readonly vm$ = this.store.vm$;
  readonly types: Array<NotificationType | 'all'> = ['all', 'info', 'warning', 'error', 'success'];

  constructor(private store: NotificationStore) {}

  ngOnInit(): void {
    this.store.init();
  }

  onTypeChange(type: NotificationType | 'all'): void {
    this.store.setType(type);
  }

  onSearchChange(value: string): void {
    this.store.setSearch(value);
  }

  onPage(e: PageEvent): void {
    this.store.setPage(e.pageIndex + 1, e.pageSize);
  }

  retry(): void {
    this.store.retry();
  }
}
