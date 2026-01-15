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
  MapPin,
  Store,
} from "lucide-react";

interface FormData {
  couponCode: string;
  name: string;
  phone: string;
  upiId: string;
  city: string;
  dealerName: string;
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
    city: "",
    dealerName: "",
  });
  const [message, setMessage] = useState<Message>({ type: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [couponInfo, setCouponInfo] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [fetchedCoupons, setFetchedCoupons] = useState<any[]>([]);
  const [isFetchingCoupons, setIsFetchingCoupons] = useState<boolean>(false);
  const [submittedReward, setSubmittedReward] = useState<number | null>(null);
  const [isCodeFromUrl, setIsCodeFromUrl] = useState<boolean>(false);

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
          // Column mapping based on new headers:
          // A: Created, B: Code, C: Status, D: Reward, E: Claimed By, F: Claimed AT
          // G: Phone Number, H: UPI Id, I: Make Payment, J: City, K: Dealer Name
          "", // Col A: Created (keep empty)
          fetchedCoupons[rowIndex - 1][1], // Col B: Code
          "used", // Col C: Status
          fetchedCoupons[rowIndex - 1][3] || 100, // Col D: Reward
          formData.name.trim(), // Col E: Claimed By
          currentTimestamp, // Col F: Claimed At
          formData.phone.trim(), // Col G: Phone Number
          formData.upiId.trim(), // Col H: UPI ID
          "", // Col I: Make Payment (empty - admin fills this)
          formData.city.trim(), // Col J: City
          formData.dealerName.trim(), // Col K: Dealer Name
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
      setIsCodeFromUrl(true);
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
    if (!formData.name.trim()) {
      setMessage({ type: "error", content: "Please enter your full name" });
      return false;
    }
    if (!formData.phone.trim()) {
      setMessage({ type: "error", content: "Please enter your phone number" });
      return false;
    }
    if (!formData.upiId.trim()) {
      setMessage({ type: "error", content: "Please enter your UPI ID" });
      return false;
    }
    if (!formData.city.trim()) {
      setMessage({ type: "error", content: "Please enter your city" });
      return false;
    }
    if (!formData.dealerName.trim()) {
      setMessage({ type: "error", content: "Please enter the dealer name" });
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
    <div className="relative flex flex-col items-center justify-center min-h-screen p-3 overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Decorative Background - Simplified */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full w-72 h-72 -top-36 -left-36 bg-gradient-to-br from-red-200/20 to-orange-200/20 blur-3xl" />
        <div className="absolute rounded-full w-72 h-72 -bottom-36 -right-36 bg-gradient-to-br from-red-200/20 to-pink-200/20 blur-3xl" />
      </div>

      {/* Main Card */}
      <Card className="relative w-full max-w-[380px] border border-white/50 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden rounded-2xl">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

        {submittedReward !== null ? (
          <div className="duration-500 animate-in fade-in zoom-in-95">
            <CardHeader className="pt-8 pb-2 text-center">
              <div className="relative mx-auto mb-4">
                <div className="relative flex items-center justify-center w-16 h-16 mx-auto rounded-full shadow-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30">
                  <Gift className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="mb-1 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                Congratulations! 🎉
              </h1>
              <p className="text-xs text-slate-500">
                You have successfully claimed your reward
              </p>
            </CardHeader>

            <CardContent className="px-5 pb-6 space-y-4 text-center">
              <div className="relative p-5 overflow-hidden border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-green-500 uppercase">
                  💰 Reward Unlocked
                </p>
                <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  ₹{submittedReward}
                </div>
              </div>

              <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <p className="mb-1 text-[10px] text-slate-400">
                  Amount will be credited to:
                </p>
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 font-mono text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-lg">
                  <Wallet className="w-3 h-3 text-green-500" />
                  {formData.upiId}
                </div>
              </div>
            </CardContent>
          </div>
        ) : (
          <>
            {/* Header Brand Section */}
            <div className="px-4 py-2.5 text-center border-b bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
              <h2 className="text-base font-bold tracking-wide text-white">
                🎁 Rigga Prime Pipes
              </h2>
              <p className="text-[9px] text-red-100 tracking-widest uppercase">
                Reward Program
              </p>
            </div>

            {/* Progress Steps - Compact */}
            <div className="px-4 py-2.5 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center justify-center w-6 h-6 text-[10px] font-bold text-white rounded-full bg-gradient-to-br from-red-500 to-red-600">
                    ✓
                  </div>
                  <span className="text-[8px] font-semibold text-red-600 uppercase">
                    Scan
                  </span>
                </div>

                <div
                  className={`flex-1 h-0.5 mx-1.5 rounded-full ${
                    formData.couponCode
                      ? "bg-gradient-to-r from-red-500 to-red-400"
                      : "bg-gray-200"
                  }`}
                />

                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-full ${
                      formData.couponCode
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-[8px] font-semibold uppercase ${
                      formData.couponCode ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    Details
                  </span>
                </div>

                <div className="flex-1 h-0.5 mx-1.5 bg-gray-200 rounded-full" />

                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center justify-center w-6 h-6 text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full">
                    3
                  </div>
                  <span className="text-[8px] font-semibold text-gray-400 uppercase">
                    Reward
                  </span>
                </div>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Coupon Code Section */}
              <div className="p-3 border-2 border-red-200 border-dashed rounded-xl bg-red-50/50">
                <label className="block mb-1.5 text-[10px] font-bold tracking-wider text-red-600 uppercase">
                  🎫 Promo Code
                </label>
                <div className="relative">
                  <Ticket className="absolute w-4 h-4 text-red-400 -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="ENTER CODE"
                    className={`pl-10 h-10 border-2 border-red-200 bg-white focus:bg-white focus:border-red-500 focus:ring-red-500 font-mono text-center tracking-[0.2em] text-sm font-bold placeholder:font-normal placeholder:tracking-normal rounded-lg ${
                      isCodeFromUrl ? "bg-red-50 cursor-not-allowed" : ""
                    }`}
                    autoComplete="off"
                    readOnly={isCodeFromUrl}
                  />
                  {isValidatingCoupon && (
                    <div className="absolute -translate-y-1/2 right-3 top-1/2">
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  📋 Your Details
                </label>

                <div className="relative group">
                  <User className="absolute w-4 h-4 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="h-10 pl-10 text-sm transition-all border rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 placeholder:text-slate-300"
                  />
                </div>

                <div className="relative group">
                  <Phone className="absolute w-4 h-4 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    className="h-10 pl-10 text-sm transition-all border rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 placeholder:text-slate-300"
                  />
                </div>

                <div className="relative group">
                  <Wallet className="absolute w-4 h-4 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="UPI ID (e.g. user@ybl)"
                    className="h-10 pl-10 text-sm transition-all border rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative group">
                    <MapPin className="absolute w-4 h-4 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="h-10 pl-10 text-sm transition-all border rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 placeholder:text-slate-300"
                    />
                  </div>

                  <div className="relative group">
                    <Store className="absolute w-4 h-4 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                    <Input
                      name="dealerName"
                      value={formData.dealerName}
                      onChange={handleInputChange}
                      placeholder="Dealer"
                      className="h-10 pl-10 text-sm transition-all border rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white focus:border-red-500 focus:ring-red-500 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleSubmit}
                className="w-full h-11 text-sm font-bold text-white shadow-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 rounded-xl shadow-red-500/25 active:scale-[0.98] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    🚀 Claim My Reward
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Error/Success Feedback */}
              {message.content && (
                <div
                  className={`text-center text-xs font-semibold p-3 rounded-xl border ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-600 border-red-200"
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

      {/* Footer */}
      <div className="mt-3 text-center">
        <a
          href="https://www.botivate.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
        >
          ⚡ Powered By <span className="font-bold">Botivate</span>
        </a>
      </div>
    </div>
  );
}
