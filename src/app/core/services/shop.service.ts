import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ShopParams } from '../../shared/models/shopParams';
import { Pagination } from '../../shared/models/pagination';
import { Product } from '../../shared/models/product';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  types: string[] = [];
  brands: string[] = [];

  getProducts(shopParams: ShopParams) {
    let params = new HttpParams();

    if (shopParams.brands.length > 0) {
      params = params.append('brands', shopParams.brands.join(','));
    }

    if (shopParams.types.length > 0) {
      params = params.append('types', shopParams.types.join(','));
    }

    if (shopParams.sort) {
      params = params.append('sort', shopParams.sort);
    }

    if (shopParams.search) {
      params = params.append('search', shopParams.search);
    }
    params = params.append('pageIndex', shopParams.pageNumber.toString());
    params = params.append('pageSize', shopParams.pageSize.toString());
    return this.http.get<Pagination<Product>>(this.baseUrl + 'products', {
      params,
    });
  }

  getBrands() {
    return this.http.get<string[]>(this.baseUrl + 'products/brands').subscribe({
      next: (brands) => (this.brands = brands),
    });
  }
  getTypes() {
    return this.http.get<string[]>(this.baseUrl + 'products/types').subscribe({
      next: (types) => (this.types = types),
    });
  }
  getProduct(id: string) {
    return this.http.get<Product>(this.baseUrl + 'products/' + id);
  }
}
