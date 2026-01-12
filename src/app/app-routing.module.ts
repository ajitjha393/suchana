import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsPageComponent } from './pages/notifications/notifications-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'notifications', pathMatch: 'full' },
  { path: 'notifications', component: NotificationsPageComponent },
  { path: '**', redirectTo: 'notifications' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
