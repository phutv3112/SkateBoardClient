import { Route } from '@angular/router';
import { OrderComponent } from './order.component';
import { authGuard } from '../../core/guards/auth.guard';
import { OrderDetailComponent } from './order-detail/order-detail.component';

export const orderRoutes: Route[] = [
  {
    path: '',
    component: OrderComponent,
    canActivate: [authGuard],
  },
  {
    path: ':id',
    component: OrderDetailComponent,
    canActivate: [authGuard],
  },
];
