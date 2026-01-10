"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  Gift,
  User,
  Phone,
  Wallet,
  Ticket,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface FormData {
  couponCode: string;
  name: string;
  phone: string;
  upiId: string;
}

interface Message {
  type: "success" | "error" | "";
  content: string;
}

interface Coupon {
  code: string;
  status: string;
  rewardAmount: number;
}

export default function QRCodeForm() {
  const [formData, setFormData] = useState<FormData>({
    couponCode: "",
    name: "",
    phone: "",
    upiId: "",
  });
  const [message, setMessage] = useState<Message>({ type: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [couponInfo, setCouponInfo] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [fetchedCoupons, setFetchedCoupons] = useState<any[]>([]);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState<boolean>(false);
  const [submittedReward, setSubmittedReward] = useState<number | null>(null);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";

  // Fetch coupons on mount
  useEffect(() => {
    const fetchCoupons = async () => {
      setIsFetchingCoupons(true);
      try {
        const response = await fetch(
          `${GOOGLE_SCRIPT_URL}?sheet=Coupons&action=fetch`
        );
        const data = await response.json();
        if (data.success && data.data) {
          setFetchedCoupons(data.data);
        }
      } catch (error) {
        console.error("Error fetching coupons:", error);
      } finally {
        setIsFetchingCoupons(false);
      }
    };

    fetchCoupons();
  }, []);

  const validateCouponLocal = (
    couponCode: string
  ): {
    isValid: boolean;
    isUsed: boolean;
    rewardAmount: number;
    rowIndex: number;
  } => {
    if (!fetchedCoupons || fetchedCoupons.length === 0) {
      // Fallback or wait? For now return false, but user might be typing before load.
      // In reality, if coupons aren't loaded, we can't validate locally.
      return { isValid: false, isUsed: false, rewardAmount: 0, rowIndex: -1 };
    }

    for (let i = 1; i < fetchedCoupons.length; i++) {
      const row = fetchedCoupons[i];
      const sheetCouponCode = row[1]
        ? row[1].toString().trim().toUpperCase()
        : "";
      const status = row[2] ? row[2].toString().trim().toLowerCase() : "";
      const rewardAmount = row[3] ? Number.parseInt(row[3]) : 100;

      if (sheetCouponCode === couponCode.trim().toUpperCase()) {
        return {
          isValid: true,
          isUsed: status === "used",
          rewardAmount: rewardAmount,
          rowIndex: i + 1, // Sheets are 1-indexed
        };
      }
    }
    return { isValid: false, isUsed: false, rewardAmount: 0, rowIndex: -1 };
  };

  const submitToGoogleSheets = async (
    formData: FormData
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const currentTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Local validation to find the row index in 'Coupons' sheet
      const validation = validateCouponLocal(formData.couponCode);
      const rowIndex = validation.rowIndex;

      if (rowIndex === -1) {
        throw new Error("Coupon not found for marking as used");
      }

      // Only update 'Coupons' sheet
      const updateParams = new URLSearchParams({
        sheetName: "Coupons",
        action: "update",
        rowIndex: rowIndex.toString(),
        rowData: JSON.stringify([
          // We don't have the full row data easily unless we access fetchedCoupons[rowIndex-1]
          // but we can trust the indexes align if fetch happened recently.
          "", // Col A: Keep empty as per user request
          fetchedCoupons[rowIndex - 1][1],
          "used",
          fetchedCoupons[rowIndex - 1][3] || 100,
          formData.name.trim(), // E: Claimed By
          currentTimestamp, // F: Claimed At
          formData.phone.trim(), // G: Phone
          formData.upiId.trim(), // H: UPI ID
        ]),
      });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: updateParams.toString(),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state to reflect 'used' status
        setFetchedCoupons((prev) => {
          const newCoupons = [...prev];
          if (newCoupons[rowIndex - 1]) {
            newCoupons[rowIndex - 1][2] = "used";
          }
          return newCoupons;
        });

        // Show success screen
        setSubmittedReward(validation.rewardAmount);

        return { success: true, message: "Form submitted successfully!" };
      } else {
        return {
          success: false,
          message: result.error || "Failed to submit form",
        };
      }
    } catch (error) {
      console.error("Error submitting to Google Sheets:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  };

  // Removed markCouponAsUsed because it's now integrated into handleSubmit for parallel execution

  // Use Next.js search params hook
  const searchParams = useSearchParams();

  useEffect(() => {
    // searchParams.get() returns the decoded value automatically
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setFormData((prev) => ({ ...prev, couponCode: codeFromUrl }));
    }
  }, [searchParams]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.couponCode.trim()) {
      setMessage({ type: "error", content: "Please enter a coupon code" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setMessage({ type: "", content: "" });

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const validation = validateCouponLocal(formData.couponCode);

    if (!validation.isValid) {
      setMessage({ type: "error", content: "Invalid coupon code." });
      setIsSubmitting(false);
      return;
    }

    if (validation.isUsed) {
      setMessage({
        type: "error",
        content: "This coupon has already been used.",
      });
      setIsSubmitting(false);
      return;
    }

    const result = await submitToGoogleSheets(formData);

    if (!result.success) {
      setMessage({ type: "error", content: result.message });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px] border-0 shadow-2xl bg-white overflow-hidden rounded-3xl">
        {submittedReward !== null ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="text-center pt-10 pb-2">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center shadow-xl shadow-green-500/20 animate-bounce">
                <Gift className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Congratulations!
              </h1>
              <p className="text-slate-500 text-sm">
                You have successfully claimed
              </p>
            </CardHeader>
            <CardContent className="p-8 pt-2 text-center space-y-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200/50 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-16 h-16 bg-green-200/50 rounded-full blur-2xl" />

                <p className="text-green-600 font-medium text-sm uppercase tracking-wider mb-1">
                  Reward Unlocked
                </p>
                <div className="text-5xl font-black text-green-700 tracking-tight">
                  ₹{submittedReward}
                </div>
              </div>

              <p className="text-slate-400 text-xs px-4">
                The amount has been credited to your UPI ID:
                <br />
                <span className="font-mono text-slate-600 font-medium">
                  {formData.upiId}
                </span>
              </p>
            </CardContent>
          </div>
        ) : (
          <>
            {/* Status Bar / Steps */}
            <div className="bg-slate-50 border-b border-gray-100 py-2 px-6">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    1
                  </span>
                  Scan
                </span>
                <div className="h-px w-8 bg-gray-200" />
                <span
                  className={
                    formData.couponCode
                      ? "text-red-500 flex items-center gap-1"
                      : "flex items-center gap-1"
                  }
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      formData.couponCode
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100"
                    }`}
                  >
                    2
                  </span>
                  Details
                </span>
                <div className="h-px w-8 bg-gray-200" />
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                    3
                  </span>
                  Reward
                </span>
              </div>
            </div>

            <CardHeader className="text-center pt-5 pb-0">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transform rotate-3">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Claim Reward</h1>
              <p className="text-slate-500 text-xs">
                Enter details to unlock your gift
              </p>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {/* Coupon Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="PROMO CODE"
                    className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 font-mono text-center tracking-widest text-sm font-bold placeholder:font-normal placeholder:tracking-normal"
                    autoComplete="off"
                  />
                  {isValidatingCoupon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="pl-10 h-10 border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    className="pl-10 h-10 border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm"
                  />
                </div>

                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="UPI ID (e.g. user@ybl)"
                    className="pl-10 h-10 border-slate-200 focus:border-red-500 focus:ring-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleSubmit}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Claim Button
                    <Sparkles className="w-4 h-4 ml-2 fill-white/20" />
                  </>
                )}
              </Button>

              {/* Error/Success Feedback */}
              {message.content && (
                <div
                  className={`text-center text-sm font-medium p-3 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {message.type === "error" && (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {message.content}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
