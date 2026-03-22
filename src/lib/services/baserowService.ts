/**
 * Baserow Service
 * Single service to handle all REST API calls to Baserow.
 */

interface BaserowParams {
  page?: number;
  size?: number;
  search?: string;
  order_by?: string;
  reverse?: boolean;
}

export class BaserowService {
  private static apiToken = process.env.BASEROW_API_TOKEN;
  private static apiUrl = process.env.BASEROW_API_URL || "https://api.baserow.io";

  private static getHeaders() {
    return {
      Authorization: `Token ${this.apiToken}`,
      "Content-Type": "application/json",
    };
  }

  static async listRows<T>(tableId: string | number, params?: BaserowParams): Promise<T[]> {
    if (!tableId) throw new Error("Table ID is required");
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.size) queryParams.append("size", params.size.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.order_by) queryParams.append("order_by", params.order_by);
    if (params?.reverse) queryParams.append("reverse", "true");

    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true&${queryParams.toString()}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`Baserow listRows error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  }

  static async getRow<T>(tableId: string | number, rowId: string | number): Promise<T> {
    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`Baserow getRow error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  static async createRow<T>(tableId: string | number, payload: any): Promise<T> {
    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Baserow createRow error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  static async updateRow<T>(tableId: string | number, rowId: string | number, payload: any): Promise<T> {
    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Baserow updateRow error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  static async deleteRow(tableId: string | number, rowId: string | number): Promise<void> {
    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/${rowId}/`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Baserow deleteRow error: ${response.status} ${response.statusText}`);
    }
  }

  static async findFirstByField<T>(tableId: string | number, field: string, value: string): Promise<T | null> {
    // Note: This is an expensive filter since we fetch and then filter client side.
    // Ideally use Baserow filter if possible, but list with search is easier to implement for MVP.
    const queryParams = new URLSearchParams();
    queryParams.append("user_field_names", "true");
    queryParams.append(`filter__field_${field}__equal`, value); // Basic filter logic assuming user_field_names handles it
    
    // For now, let's use search or a more direct filter if the above doesn't work well
    const url = `${this.apiUrl}/api/database/rows/table/${tableId}/?user_field_names=true&filter__${field}__equal=${encodeURIComponent(value)}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`Baserow findFirstByField error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results[0] || null;
  }
}
