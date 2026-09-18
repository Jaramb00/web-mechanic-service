/** Tipovi koje vraća backend. Držati usklađeno s DTO-ovima u `hr.demo.vulkanizer`. */

export type RoleName = 'CUSTOMER' | 'EMPLOYEE' | 'WAREHOUSE_WORKER' | 'ADMIN';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  roles: RoleName[];
};

export type ServiceView = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
};

export type VehicleView = {
  id: number;
  ownerId: number;
  make: string;
  model: string;
  modelYear: number | null;
  registration: string;
  tireSize: string | null;
  vin: string | null;
};

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentItemView = {
  id: number;
  productId: number | null;
  serviceId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type AppointmentView = {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string | null;
  vehicleId: number;
  vehicleLabel: string | null;
  vehicleTireSize: string | null;
  serviceId: number;
  serviceName: string | null;
  bayName: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  customerNote: string | null;
  mechanicNote: string | null;
  items: AppointmentItemView[];
  itemsTotal: number;
  cancellable: boolean;
};

export type SlotView = {
  startAt: string;
  endAt: string;
  available: boolean;
  freeBays: number;
};

export type DayAvailability = {
  date: string;
  closed: boolean;
  note: string | null;
  slots: SlotView[];
};

export type WorkingHoursView = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
};

export type ProductView = {
  id: number;
  sku: string;
  name: string;
  manufacturer: string | null;
  categoryCode: string;
  categoryName: string;
  description: string | null;
  tireSize: string | null;
  salePrice: number;
  availableQuantity: number;
  active: boolean;
};

export type ProductStockView = ProductView & {
  purchasePrice: number | null;
  physicalQuantity: number;
  reservedQuantity: number;
  minQuantity: number;
  lowStock: boolean;
};

export type MovementType =
  | 'INITIAL_STOCK'
  | 'PURCHASE'
  | 'RESERVATION'
  | 'RELEASE'
  | 'SERVICE_USAGE'
  | 'ADJUSTMENT';

export type StockMovementView = {
  id: number;
  productId: number;
  productSku: string | null;
  productName: string | null;
  movementType: MovementType;
  deltaPhysical: number;
  deltaReserved: number;
  referenceType: string | null;
  referenceId: number | null;
  createdBy: number | null;
  note: string | null;
  createdAt: string;
};

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';

export type ReservationView = {
  id: number;
  customerId: number;
  customerName: string | null;
  productId: number;
  productSku: string | null;
  productName: string | null;
  appointmentId: number | null;
  quantity: number;
  unitPrice: number;
  total: number;
  status: ReservationStatus;
  pickupNote: string | null;
  cancellable: boolean;
  createdAt: string;
};

export type CategoryView = { id: number; code: string; name: string };

export type NotificationView = {
  id: number;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  appointmentsToday: number;
  appointmentsPending: number;
  completedToday: number;
  lowStockCount: number;
  activeReservations: number;
  customersCount: number;
  vehiclesCount: number;
  todaySchedule: AppointmentView[];
  lowStockItems: ProductStockView[];
};

export type UserView = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  active: boolean;
  roles: RoleName[];
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
