import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../../types/notification';

type StreamEvent =
  | { type: 'connected' }
  | { type: 'notification_created'; payload: Notification };

@Injectable({ providedIn: 'root' })
export class NotificationStreamService {
  constructor(private zone: NgZone) {}

  connect(url: string): Observable<StreamEvent> {
    return new Observable<StreamEvent>((subscriber) => {
      const es = new EventSource(url);

      es.addEventListener('connected', () => {
        // EventSource callbacks run outside Angular sometimes; bring it in.
        this.zone.run(() => subscriber.next({ type: 'connected' }));
      });

      es.addEventListener('notification_created', (e: MessageEvent) => {
        this.zone.run(() => {
          subscriber.next({ type: 'notification_created', payload: JSON.parse(e.data) });
        });
      });

      es.onerror = (err) => {
        this.zone.run(() => subscriber.error(err));
      };

      return () => {
        es.close();
      };
    });
  }
}
