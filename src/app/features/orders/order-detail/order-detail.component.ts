import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models/order';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AddressPipe } from '../../../shared/pipes/address.pipe';
import { PaymentCardPipe } from '../../../shared/pipes/payment-card.pipe';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    MatCard,
    CurrencyPipe,
    DatePipe,
    AddressPipe,
    PaymentCardPipe,
    RouterLink,
    MatButton,
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private activatedRoute = inject(ActivatedRoute);
  order?: Order;
  ngOnInit(): void {
    this.loadOrder();
  }
  loadOrder() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;
    this.orderService.getOrderDetailed(id).subscribe({
      next: (order) => {
        this.order = order;
      },
    });
  }
}
