/**
 * Order normalization helpers
 */
type RawRecord = Record<string, unknown>;

export interface NormalizedOrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface NormalizedOrder {
  id: string;
  chefId?: string;
  chefName?: string;
  driverId?: string;
  status: string;
  items: NormalizedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  tip: number;
  total: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat?: number;
    lng?: number;
  };
  createdAt: string;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readFirst = (record: RawRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

const resolveCents = (value: unknown, centsValue: unknown): number => {
  const cents = toNumber(centsValue);
  if (cents !== null) {
    return Math.round(cents);
  }

  const raw = toNumber(value);
  if (raw === null) {
    return 0;
  }

  // Treat small or non-integer values as dollars and convert to cents:
  // - values <= 500 are interpreted as dollars and multiplied by 100
  // - values > 500 are assumed to already be in cents
  if (!Number.isInteger(raw) || raw <= 500) {
    return Math.round(raw * 100);
  }

  return raw;
};

const normalizeItems = (rawItems: unknown): NormalizedOrderItem[] => {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((item, index) => {
    const record = (item || {}) as RawRecord;
    const price = resolveCents(record.price, readFirst(record, ['priceCents', 'price_cents']));
    const quantity = toNumber(record.quantity) ?? 1;

    return {
      id: (record.id as string) || (record.itemId as string) || `${index}`,
      menuItemId: record.menuItemId as string,
      name: (record.name as string) || (record.title as string) || 'Item',
      price,
      quantity,
    };
  });
};

export const normalizeOrder = (raw: unknown): NormalizedOrder => {
  const record = (raw || {}) as RawRecord;
  const address = (record.deliveryAddress ||
    record.delivery_address ||
    record.address ||
    record.delivery) as RawRecord | undefined;

  const addressLat = toNumber(
    readFirst(record, ['deliveryLat', 'delivery_lat']) ?? address?.lat ?? address?.latitude,
  );
  const addressLng = toNumber(
    readFirst(record, ['deliveryLng', 'delivery_lng']) ?? address?.lng ?? address?.longitude,
  );

  const items = normalizeItems(
    readFirst(record, ['items', 'orderItems', 'order_items', 'lineItems']),
  );

  return {
    id:
      (record.id as string) ||
      (record.orderId as string) ||
      (record.order_id as string) ||
      'unknown',
    chefId:
      (record.chefId as string) ||
      (record.cookId as string) ||
      ((record.chef as RawRecord)?.id as string),
    chefName:
      (record.chefName as string) ||
      ((record.chef as RawRecord)?.businessName as string) ||
      ((record.chef as RawRecord)?.name as string) ||
      (record.cookName as string),
    driverId: (record.driverId as string) || ((record.driver as RawRecord)?.id as string),
    status: (record.status as string) || (record.state as string) || 'pending',
    items,
    subtotal: resolveCents(
      readFirst(record, ['subtotal', 'subtotalAmount']),
      readFirst(record, ['subtotalCents', 'subtotal_cents']),
    ),
    deliveryFee: resolveCents(
      readFirst(record, ['deliveryFee', 'delivery_fee']),
      readFirst(record, ['deliveryFeeCents', 'delivery_fee_cents']),
    ),
    serviceFee: resolveCents(
      readFirst(record, ['serviceFee', 'service_fee']),
      readFirst(record, ['serviceFeeCents', 'service_fee_cents']),
    ),
    tax: resolveCents(
      readFirst(record, ['tax', 'taxAmount']),
      readFirst(record, ['taxCents', 'tax_cents']),
    ),
    tip: resolveCents(readFirst(record, ['tip', 'tipAmount']), readFirst(record, ['tipCents'])),
    total: resolveCents(
      readFirst(record, ['total', 'totalAmount']),
      readFirst(record, ['totalCents', 'total_cents', 'total_amount_cents']),
    ),
    deliveryAddress: {
      street:
        (address?.street as string) ||
        (address?.line1 as string) ||
        (record.deliveryStreet as string) ||
        '',
      city:
        (address?.city as string) ||
        (record.deliveryCity as string) ||
        (address?.locality as string) ||
        '',
      state:
        (address?.state as string) ||
        (record.deliveryState as string) ||
        (address?.region as string) ||
        '',
      zipCode:
        (address?.zipCode as string) ||
        (address?.postalCode as string) ||
        (address?.zip as string) ||
        '',
      lat: addressLat ?? undefined,
      lng: addressLng ?? undefined,
    },
    createdAt:
      (record.createdAt as string) ||
      (record.created_at as string) ||
      (record.created as string) ||
      new Date().toISOString(),
  };
};
