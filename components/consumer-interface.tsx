"use client"

import { useState, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { storageUtils } from "@/lib/storage-utils"
import type { FormData, Message, Coupon } from "@/components/types/coupon"

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";

export default function PremiumConsumerInterface() {
  const [formData, setFormData] = useState<FormData>({
    couponCode: "",
    name: "", // We still keep this in state for redemption compatibility
    phone: "",
    email: "", // We keep this to avoid breaking storageUtils
  })
  
  const [regData, setRegData] = useState({
    userName: "",
    pass: "",
    gmail: "",
    upiId: "",
    city: "",
    dealerName: "",
  })

  const [message, setMessage] = useState<Message>({ type: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [showRegModal, setShowRegModal] = useState<boolean>(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setRegData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validatePrimaryForm = (): boolean => {
    if (!formData.couponCode.trim()) {
      setMessage({ type: "error", content: "Please enter a coupon code" })
      return false
    }
    if (!formData.phone.trim()) {
      setMessage({ type: "error", content: "Please enter your phone number" })
      return false
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      setMessage({ type: "error", content: "Please enter a valid 10-digit phone number" })
      return false
    }
    return true
  }

  const validateRegForm = (): boolean => {
    if (!regData.userName.trim()) return false
    if (!regData.pass.trim()) return false
    return true
  }

  const processRedemption = (name: string, email: string) => {
    const result = storageUtils.redeemCoupon(formData.couponCode, {
      name: name || "User",
      phone: formData.phone,
      email: email || "user@example.com",
    })

    if (result.success) {
      setMessage({
        type: "success",
        content: `Congratulations! Your coupon has been successfully redeemed. ₹${result.rewardAmount} reward has been credited to your account.`,
      })
      setFormData({
        couponCode: "",
        name: "",
        phone: "",
        email: "",
      })
    } else {
      setMessage({
        type: "error",
        content: result.message,
      })
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: "", content: "" })

    if (!validatePrimaryForm()) {
      setIsSubmitting(false)
      return
    }

    // Check if the coupon code is even valid before hitting the Google API
    const coupons = storageUtils.getCoupons()
    const couponIndex = coupons.findIndex((coupon) => coupon.code === formData.couponCode)

    if (couponIndex === -1) {
      setMessage({ type: "error", content: "Invalid coupon code. Please check and try again." })
      setIsSubmitting(false)
      return
    }
    if (coupons[couponIndex].status === "used") {
      setMessage({ type: "error", content: "This coupon has already been used and cannot be redeemed again." })
      setIsSubmitting(false)
      return
    }

    try {
      // 1. Fetch UserData to check if phone exists
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=UserData&action=fetch`);
      const result = await response.json();
      
      let userFound = false;
      let existingName = "";
      let existingEmail = "";

      if (result.success && result.data) {
        // Find by phone (ID is column C / index 2)
        const foundRow = result.data.slice(1).find((row: string[]) => String(row[2] || "") === formData.phone);
        if (foundRow) {
          userFound = true;
          existingName = String(foundRow[1] || "");
          existingEmail = String(foundRow[5] || "");
        }
      }

      if (userFound) {
        // User exists! Claim reward immediately.
        processRedemption(existingName, existingEmail);
      } else {
        // Not found, open registration modal
        setShowRegModal(true);
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      setMessage({ type: "error", content: "Could not verify your account. Please try again later." });
    }

    setIsSubmitting(false)
  }

  const handleRegistrationSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateRegForm()) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setIsRegistering(true);

    try {
      // Fetch latest SN prefix
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=UserData&action=fetch`);
      const result = await response.json();
      let maxNum = 0;
      if (result.success && result.data) {
        result.data.slice(1).forEach((row: string[]) => {
          const match = String(row[0] || "").match(/SN-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
      }
      
      const nextNum = maxNum + 1;
      const serialNo = `SN-${String(nextNum).padStart(3, "0")}`;
      const now = new Date();
      const timestamp = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const rowData = [
        serialNo, 
        regData.userName, 
        formData.phone, // using the phone they entered
        regData.pass, 
        "User", 
        regData.gmail, 
        regData.upiId, 
        regData.city, 
        regData.dealerName, 
        timestamp
      ];

      const submitParams = new URLSearchParams({
        sheetName: "UserData",
        action: "insert",
        rowData: JSON.stringify(rowData),
      });

      const saveRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: submitParams.toString(),
      });
      const saveResult = await saveRes.json();

      if (saveResult.success) {
        setShowRegModal(false);
        // Process redemption immediately after successful registration
        processRedemption(regData.userName, regData.gmail);
        // Reset reg form
        setRegData({
          userName: "", pass: "", gmail: "", upiId: "", city: "", dealerName: ""
        });
      } else {
        alert("Registration failed: " + saveResult.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during registration.");
    } finally {
      setIsRegistering(false);
    }
  }

  const simulateScan = (): void => {
    const coupons = storageUtils.getCoupons()
    const unusedCoupons = coupons.filter((c: Coupon) => c.status === "unused")

    if (unusedCoupons.length > 0) {
      const randomCoupon = unusedCoupons[Math.floor(Math.random() * unusedCoupons.length)]
      setFormData((prev) => ({
        ...prev,
        couponCode: randomCoupon.code,
      }))
      setMessage({
        type: "success",
        content: "Coupon scanned successfully! Please fill in your phone number.",
      })
    } else {
      setMessage({
        type: "error",
        content: "No unused coupons available for scanning simulation.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gray-50 to-stone-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Main Card */}
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          
          <CardHeader className="text-center px-6 sm:px-8 py-8 bg-gradient-to-b from-gray-50/50 to-white">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Coupon Redemption
            </CardTitle>
            <p className="text-gray-600 text-sm leading-relaxed">
              Scan your barcode or enter the code manually to claim your ₹100 reward
            </p>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8">
            <div className="space-y-8">
              
              {/* Scan Section */}
              <div className="text-center py-8 px-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-.01M12 12v4m6-7h2M6 20h2m2-6h2m2 0h2M6 9h2m2-6h2m2 0h2M6 4h2m6 7h2m-8 0h2m0 0h2"/>
                  </svg>
                </div>
                <Button 
                  onClick={simulateScan}
                  type="button"
                  className="mb-4 px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Simulate Barcode Scan
                </Button>
                <p className="text-xs text-gray-500">
                  Click above to simulate scanning a barcode for demo purposes
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="couponCode" className="text-sm font-semibold text-gray-700">
                    Coupon Code *
                  </Label>
                  <Input
                    id="couponCode"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleInputChange}
                    placeholder="Enter coupon code (e.g., WIN100-00001)"
                    className="font-mono border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 text-center tracking-wider"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Phone Number (ID) *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your 10-digit phone number"
                    className="border-gray-200 rounded-xl py-4 px-4 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : (
                    "Claim Reward"
                  )}
                </Button>
              </form>

              {/* Messages */}
              {message.content && (
                <Alert className={`rounded-xl border-0 shadow-lg ${
                  message.type === "error" 
                    ? "bg-red-50 border-red-200" 
                    : "bg-green-50 border-green-200"
                }`}>
                  <AlertDescription className={`font-medium text-center py-1 ${
                    message.type === "error" 
                      ? "text-red-700" 
                      : "text-green-700"
                  }`}>
                    {message.content}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-6 sm:px-8 py-6">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              How to Use
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-6">
            <div className="space-y-4">
              {[
                "Scan the barcode on your coupon using the simulate button above",
                "Enter your phone number to verify your identity",
                "If you are not registered, you will be asked to create an account",
                "Each coupon can only be used once",
                "You will receive a confirmation message upon successful redemption"
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-4 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5 shadow-sm">
                    {index + 1}
                  </div>
                  <p className="leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegModal} onOpenChange={setShowRegModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Create New Account
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Your phone number was not found. Please register to claim your reward.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegistrationSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="regUserName" className="text-sm font-semibold">Name *</Label>
              <Input
                id="regUserName" name="userName"
                value={regData.userName} onChange={handleRegInputChange}
                required placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Phone Number (ID)</Label>
              <Input value={formData.phone} disabled className="bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regPass" className="text-sm font-semibold">Password *</Label>
                <Input
                  id="regPass" name="pass"
                  value={regData.pass} onChange={handleRegInputChange}
                  required placeholder="Password" type="password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regGmail" className="text-sm font-semibold">Email</Label>
                <Input
                  id="regGmail" name="gmail"
                  value={regData.gmail} onChange={handleRegInputChange}
                  placeholder="Email" type="email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regUpi" className="text-sm font-semibold">UPI ID</Label>
                <Input
                  id="regUpi" name="upiId"
                  value={regData.upiId} onChange={handleRegInputChange}
                  placeholder="UPI ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regCity" className="text-sm font-semibold">City</Label>
                <Input
                  id="regCity" name="city"
                  value={regData.city} onChange={handleRegInputChange}
                  placeholder="City"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regDealer" className="text-sm font-semibold">Dealer Name</Label>
              <Input
                id="regDealer" name="dealerName"
                value={regData.dealerName} onChange={handleRegInputChange}
                placeholder="Dealer Name"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl mt-6"
              disabled={isRegistering}
            >
              {isRegistering ? "Registering & Claiming..." : "Register & Claim Reward"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}