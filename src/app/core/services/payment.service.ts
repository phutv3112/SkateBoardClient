import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { PaymentVnPayModel } from '../../shared/models/payment.vnpay';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getPaymentVnPayUrl(model: PaymentVnPayModel) {
    return this.http.post(this.baseUrl + 'payments/vnpay-url', model, {
      responseType: 'text',
    });
  }
}
