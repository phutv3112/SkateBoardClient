import {
  Component,
  inject,
  NgModule,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { SnackbarService } from '../../core/services/snackbar.service';
import { StripeService } from '../../core/services/stripe.service';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { CartService } from '../../core/services/cart.service';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  ConfirmationToken,
  StripeAddressElement,
  StripeAddressElementChangeEvent,
  StripePaymentElement,
  StripePaymentElementChangeEvent,
} from '@stripe/stripe-js';
import { firstValueFrom } from 'rxjs';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Address } from '../../shared/models/user';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { OrderSummaryComponent } from '../../shared/components/order-summary/order-summary.component';
import { MatButtonModule } from '@angular/material/button';
import { CheckoutDeliveryComponent } from './checkout-delivery/checkout-delivery.component';
import { CheckoutReviewComponent } from './checkout-review/checkout-review.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderToCreate, ShippingAddress } from '../../shared/models/order';
import { OrderService } from '../../core/services/order.service';
import { MatRadioModule } from '@angular/material/radio';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentVnPayModel } from '../../shared/models/payment.vnpay';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    MatStepperModule,
    MatCheckboxModule,
    OrderSummaryComponent,
    MatButtonModule,
    RouterLink,
    CheckoutDeliveryComponent,
    CheckoutReviewComponent,
    CurrencyPipe,
    MatProgressSpinnerModule,
    MatRadioModule,
    CommonModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private stripeService = inject(StripeService);
  private snackbar = inject(SnackbarService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private accountService = inject(AccountService);
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  addressElement?: StripeAddressElement;
  paymentElement?: StripePaymentElement;
  saveAddress = false;
  completionStatus = signal<{
    address: boolean;
    card: boolean;
    delivery: boolean;
  }>({ address: false, card: false, delivery: false });
  paymentMethod = signal<'VNPay' | 'Card'>('VNPay');
  confirmationToken?: ConfirmationToken;
  loading = false;

  async ngOnInit() {
    try {
      this.addressElement = await this.stripeService.createAddressElement();
      this.addressElement.mount('#address-element');
      this.addressElement.on('change', this.handleAddressChange);

      this.paymentElement = await this.stripeService.createPaymentElement();
      if (this.paymentMethod() === 'Card') {
        this.mountPaymentElement();
        //this.paymentElement.mount('#payment-element');
        //this.paymentElement.on('change', this.handlePaymentChange);
      }
      //this.paymentElement.mount('#payment-element');
      this.paymentElement.on('change', this.handlePaymentChange);
    } catch (error: any) {
      this.snackbar.error(error.message);
    }
  }
  setPaymentMethod(value: 'VNPay' | 'Card') {
    console.log('payment method: ' + value);
    this.paymentMethod.set(value);
    setTimeout(() => {
      if (value === 'Card') {
        this.mountPaymentElement();
      } else {
        this.unmountPaymentElement();
      }
    }, 100);
  }
  private mountPaymentElement() {
    const paymentElementContainer = document.getElementById('payment-element');
    if (paymentElementContainer && this.paymentElement) {
      this.paymentElement.mount('#payment-element');
    }
  }

  private unmountPaymentElement() {
    if (this.paymentElement) {
      this.paymentElement.unmount();
    }
  }
  handleAddressChange = (event: StripeAddressElementChangeEvent) => {
    this.completionStatus.update((state) => {
      state.address = event.complete;
      return state;
    });
  };

  handlePaymentChange = (event: StripePaymentElementChangeEvent) => {
    this.completionStatus.update((state) => {
      state.card = event.complete;
      return state;
    });
  };

  handleDeliveryChange(event: boolean) {
    this.completionStatus.update((state) => {
      state.delivery = event;
      return state;
    });
  }

  async getConfirmationToken() {
    try {
      if (
        Object.values(this.completionStatus()).every(
          (status) => status === true
        )
      ) {
        const result = await this.stripeService.createConfirmationToken();
        if (result.error) throw new Error(result.error.message);
        this.confirmationToken = result.confirmationToken;
        console.log(this.confirmationToken);
      }
    } catch (error: any) {
      this.snackbar.error(error.message);
    }
  }

  async onStepChange(event: StepperSelectionEvent) {
    if (event.selectedIndex === 1) {
      console.log('step 1, save address =', this.saveAddress);
      if (this.saveAddress) {
        const address = (await this.getAddressFromStripeAddress()) as Address;
        address && firstValueFrom(this.accountService.updateAddress(address));
      }
    }
    if (event.selectedIndex === 2) {
      await firstValueFrom(this.stripeService.createOrUpdatePaymentIntent());
    }
    if (event.selectedIndex === 3) {
      await this.getConfirmationToken();
    }
  }

  async confirmPayment(stepper: MatStepper) {
    this.loading = true;
    try {
      if (this.paymentMethod() == 'Card') {
        if (this.confirmationToken) {
          const result = await this.stripeService.confirmPayment(
            this.confirmationToken
          );
          if (result.paymentIntent?.status === 'succeeded') {
            const order = await this.createOrderModel();
            const orderResult = await firstValueFrom(
              this.orderService.createOrder(order)
            );
            if (orderResult) {
              this.orderService.orderCompleted = true;
              this.cartService.deleteCart();
              this.cartService.selectedDelivery.set(null);
              this.router.navigateByUrl('/checkout/success');
            } else {
              throw new Error('Failed to create order');
            }
          } else if (result.error) {
            throw new Error(result.error.message);
          } else {
            throw new Error('Something went wrong');
          }
        }
      } else {
        var model: PaymentVnPayModel = {
          orderType: 'other',
          amount: this.cartService.totals()?.total || 0,
          orderDescription: 'Order',
          name: 'Order',
        };
        this.paymentService.getPaymentVnPayUrl(model).subscribe({
          next: (url) => {
            console.log('Redirecting to VNPAY:', url);
            window.location.href = url;
          },
          error: (error) => {
            console.log('Get VnPay url err:', error);
          },
        });
      }
    } catch (error: any) {
      this.snackbar.error(error.message || 'Something went wrong');
      stepper.previous();
    } finally {
      this.loading = false;
    }
  }

  private async createOrderModel(): Promise<OrderToCreate> {
    const cart = this.cartService.cart();
    const shippingAddress =
      (await this.getAddressFromStripeAddress()) as ShippingAddress;
    const card = this.confirmationToken?.payment_method_preview.card;

    if (!cart?.id || !cart.deliveryMethodId || !card || !shippingAddress) {
      throw new Error('Problem creating order');
    }
    return {
      cartId: cart.id,
      paymentSummary: {
        last4: +card.last4,
        brand: card.brand,
        exMonth: card.exp_month,
        exYear: card.exp_year,
      },
      deliveryMethodId: cart.deliveryMethodId,
      shippingAddress,
      discount: this.cartService.totals()?.discount,
    };
  }

  private async getAddressFromStripeAddress(): Promise<
    Address | ShippingAddress | null
  > {
    const result = await this.addressElement?.getValue();
    const address = result?.value.address;

    if (address) {
      return {
        name: result.value.name,
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        country: address.country,
        state: address.state,
        postalCode: address.postal_code,
      };
    } else return null;
  }

  onSaveAddressCheckboxChange(event: MatCheckboxChange) {
    this.saveAddress = event.checked;
  }

  ngOnDestroy(): void {
    this.stripeService.disposeElements();
  }
}
