/** Claves por defecto; cámbialas si tu app usa otras */
const STORE_TOKEN_KEY = 'store_token';
const AUTH_TOKEN_KEY = 'auth_token';
const ACTIVE_STORE_ID_KEY = 'active_store_id'; // si tu app guarda aquí la tienda activa

const ROOT_AUTH = '/api/auth/cashiers';
const ROOT_CASHIERS = '/api/cashiers';
const STORE_ROOT = '/api/stores'; // /api/stores/:storeId/cashiers

function readToken(): string | null {
    try {
        return (
            localStorage.getItem(STORE_TOKEN_KEY) ||
            localStorage.getItem(AUTH_TOKEN_KEY) ||
            localStorage.getItem('token')
        );
    } catch {
        return null;
    }
}

function readActiveStoreId(fallback?: string): string | undefined {
    try {
        return fallback || localStorage.getItem(ACTIVE_STORE_ID_KEY) || undefined;
    } catch {
        return fallback;
    }
}

function baseHeaders(storeId?: string): Record<string, string> {
    const token = readToken();
    const sid = readActiveStoreId(storeId);
    const headers: Record<string, string> = {
        'X-App-Id': 'merchant',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (sid) headers['X-Store-Id'] = sid;
    return headers;
}

async function http<T = any>(input: string, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        credentials: 'include',
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    // @ts-ignore
    return await res.text();
}

function withQuery(base: string, params?: Record<string, any>): string {
    const url = new URL(base, window.location.origin);
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    return url.toString();
}

/** Lista de cajeras (prueba /auth y /cashiers; cae a /stores/:storeId/cashiers) */
export async function listCashiers(params: {
    storeId: string;
    q?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}) {
    const headers = baseHeaders(params.storeId);

    for (const root of [ROOT_AUTH, ROOT_CASHIERS]) {
        try {
            const url = withQuery(root, params);
            const data = await http<any>(url, { headers });
            const items = data?.data ?? data?.items ?? data ?? [];
            if (Array.isArray(items)) return data;
        } catch {
            // intenta siguiente
        }
    }

    const url = withQuery(`${STORE_ROOT}/${params.storeId}/cashiers`, {
        q: params.q,
        page: params.page,
        limit: params.limit,
        startDate: params.startDate,
        endDate: params.endDate,
    });
    return await http<any>(url, { headers });
}

/** Crear cajera (adjunta storeId) */
export async function createCashier(payload: {
    name: string;
    phoneNumber: string;
    email?: string;
    storeId: string;
}) {
    const headers = baseHeaders(payload.storeId);

    for (const root of [ROOT_AUTH, ROOT_CASHIERS]) {
        try {
            const url = withQuery(root);
            return await http<any>(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
        } catch {
            // intenta siguiente
        }
    }

    const url = withQuery(`${STORE_ROOT}/${payload.storeId}/cashiers`);
    return http<any>(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
}

/** Conteo por tienda (si existe) */
export async function getCashierCountByStore(storeId: string) {
    const headers = baseHeaders(storeId);

    const candidates = [
        '/api/auth/cashiers/count',
        '/api/cashiers/count',
        `/api/stores/${storeId}/cashiers/count`,
    ];

    for (const path of candidates) {
        try {
            const url = withQuery(path, { storeId });
            const res = await http<any>(url, { headers });
            const count = res?.count ?? res?.total ?? res?.data ?? res;
            if (typeof count === 'number') return count;
        } catch {
            // intenta siguiente
        }
    }
    return undefined;
}

export default { listCashiers, createCashier, getCashierCountByStore };