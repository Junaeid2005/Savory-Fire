export interface UserProfile {
  uid: string;
  email: string;
  isAdmin: boolean;
  createdAt: any;
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  isAvailable: boolean;
  createdAt?: any;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  totalPrice: number;
  referenceNumber: string;
  paymentStatus: "pending" | "paid";
  createdAt: any;
}
