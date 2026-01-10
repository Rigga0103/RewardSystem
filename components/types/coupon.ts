export interface Coupon {
  id: number;
  code: string;
  status: "used" | "unused";
  rewardAmount: number;
  createdAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
}

export interface Consumer {
  name: string;
  phone: string;
  email: string;
  couponCode: string;
  date: string;
}

export interface FormData {
  couponCode: string;
  name: string;
  phone: string;
  email: string;
}

export interface Message {
  type: "success" | "error" | "";
  content: string;
}

export interface RedemptionResult {
  success: boolean;
  message: string;
  rewardAmount?: number;
}

export interface CouponTableProps {
  coupons: Coupon[];
  title: string;
  emptyMessage: string;
}

export interface BarcodeDisplayProps {
  code: string;
  formLink: string;
}