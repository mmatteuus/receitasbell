import { fetchBaserow, BASEROW_TABLES } from "./client.js";

export interface TenantRecord {
  id: number;
  name: string;
  slug: string;
}

export async function findTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&filter__slug__equal=${normalizedSlug}`
  );
  
  const record = data.results[0];
  if (!record) return null;
  
  return mapTenantRowToRecord(record);
}

export async function findTenantByHost(host: string): Promise<TenantRecord | null> {
  const normalizedHost = host.trim().toLowerCase();
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true&filter__host__equal=${normalizedHost}`
  );
  
  const record = data.results[0];
  if (!record) return null;
  
  return mapTenantRowToRecord(record);
}

function mapTenantRowToRecord(row: any): TenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

export async function findTenantById(id: string | number): Promise<TenantRecord | null> {
  try {
    const record = await fetchBaserow<any>(
      `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/${id}/?user_field_names=true`
    );
    
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
    };
  } catch (err) {
    return null;
  }
}

export async function listTenants(): Promise<TenantRecord[]> {
  const data = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true`
  );
  
  return data.results.map(record => ({
    id: record.id,
    name: record.name,
    slug: record.slug,
  }));
}

export async function createTenant(name: string, slug: string): Promise<TenantRecord> {
  const record = await fetchBaserow<any>(
    `/api/database/rows/table/${BASEROW_TABLES.TENANTS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({ name, slug: slug.toLowerCase() }),
    }
  );
  
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
  };
}
