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

  bulkMarkRead(read: boolean): void {
    this.store.bulkMarkRead(read);
  }

  bulkDeleteAll(): void {
    this.store.deleteAll();
  }

  bulkDeleteSelected(): void {
    this.store.bulkDeleteSelected();
  }

  selectedCount(): number {
    return this.store.selectedCount();
  }

  selectAllOnPage(select: boolean): void {
    this.store.selectAllOnPage(select);
  }

  isSelected(id: string): boolean {
    return this.store.isSelected(id);
  }

  toggleSelected(id: string, selected: boolean): void {
    this.store.toggleSelected(id, selected);
  }

  isAllSelectedOnPage(): boolean {
    return this.store.isAllSelectedOnPage();
  }

  isAnySelectedOnPage(): boolean {
    return this.store.isAnySelectedOnPage();
  }
  

  retry(): void {
    this.store.retry();
  }
}
