import { NotificationType } from "./notification";


export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}


export interface GetNotificationsQuery {
  page: number;
  pageSize: number;
  type?: NotificationType | 'all';
  search?: string;
}