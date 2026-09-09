// Shared TypeScript models and interfaces for Smart Canteen Management System

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type FoodCategory = 'Meals' | 'Fast Food' | 'Snacks' | 'Beverages';

export interface MenuItem {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  description: string;
  image: string;
  available: boolean;
  calories?: string;
  badge?: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CustomerDetails {
  name: string;
  mobileNumber: string;
  email?: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  tokenNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  statusNotes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  deviceTokens?: string[];
}

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  email?: string;
  notificationTokens: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id?: string;
  notificationId: string;
  orderId: string;
  tokenNumber?: string;
  customerId?: string;
  mobileNumber?: string;
  status: OrderStatus;
  message: string;
  sentAt: string;
  success: boolean;
  recipientCount?: number;
  error?: string;
}
