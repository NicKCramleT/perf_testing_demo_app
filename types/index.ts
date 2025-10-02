import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  createdAt?: Date;
  candidateId?: ObjectId | string; // ownership scoping (migrating to ObjectId)
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Product {
  _id?: ObjectId;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  sku: string;
  quantity: number;
  price: number; // unit price at order time
}

export interface Order {
  _id?: ObjectId;
  items: OrderItem[];
  total: number;
  userEmail?: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  createdAt?: Date;
  updatedAt?: Date;
  candidateId?: ObjectId | string; // ownership scoping (migrating to ObjectId)
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Candidate {
  _id?: ObjectId;
  username: string; // unique, lowercase
  passwordHash: string; // hashed password
  createdAt?: Date;
  lastLoginAt?: Date;
  active?: boolean;
  isAdmin?: boolean;
}
