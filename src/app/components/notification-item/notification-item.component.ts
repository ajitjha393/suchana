import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Notification } from '../../types/notification';
import { NotificationStore } from '../../store/notification.store';

@Component({
  selector: 'app-notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  @Input() selected = false;
  @Output() selectedChange = new EventEmitter<boolean>();


  constructor(private store: NotificationStore) {}

  toggleRead(): void {
    this.store.toggleRead(this.notification);
  }

  delete(): void {
    this.store.delete(this.notification);
  }

  typeIcon(): string {
  switch (this.notification.type) {
    // Can move this to Enum or Discriminated unions for better maintainability if more types are added
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'success':
      return 'check_circle';
    case 'info':
    default:
      return 'info';
  }
}

}
