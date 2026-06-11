"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Phone, Mail, CreditCard, MapPin, Store, Lock, Save, X, Eye, EyeOff } from "lucide-react";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
  initialData?: {
    name?: string;
    phone?: string;
    city?: string;
    dealerName?: string;
    upiId?: string;
  };
  googleScriptUrl: string;
  existingUsers: any[];
}

export default function SignUpModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = {},
  googleScriptUrl,
  existingUsers,
}: SignUpModalProps) {
  const [formData, setFormData] = useState({
    userName: initialData.name || "",
    phone: initialData.phone || "",
    gmail: "",
    upiId: initialData.upiId || "",
    city: initialData.city || "",
    dealerName: initialData.dealerName || "",
    pass: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userName: initialData.name || "",
        phone: initialData.phone || "",
        gmail: "",
        upiId: initialData.upiId || "",
        city: initialData.city || "",
        dealerName: initialData.dealerName || "",
        pass: "",
      });
      setError("");
      setShowSuccess(false);
      setShowPassword(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Limit phone to 10 digits and auto-set password
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 10) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
        pass: numericValue // Auto-set password to phone number
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSerialNo = () => {
    // existingUsers[0] is usually headers
    const count = existingUsers.length > 1 ? existingUsers.length - 1 : 0;
    const nextNum = count + 1;
    return `SN-${nextNum.toString().padStart(3, "0")}`;
  };

  const formatTimestamp = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const handleSubmit = async () => {
    // Auto-set password to phone number before validation
    const finalPassword = formData.phone;

    if (
      !formData.userName ||
      !formData.phone ||
      !formData.gmail ||
      !formData.upiId ||
      !formData.city ||
      !formData.dealerName
    ) {
      setError("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const serialNo = generateSerialNo();
      const timestamp = formatTimestamp();

      // Column mapping:
      // A: Serial No, B: User Name, C: Phone Number, D: Pass, E: Role, F: Gmail, G: UPI, H: City, I: Dealer Name, J: Timestamp
      const rowData = [
        serialNo, // A
        formData.userName, // B
        formData.phone, // C
        finalPassword, // D (Password = Phone Number)
        "user", // E (Role)
        formData.gmail, // F
        formData.upiId, // G
        formData.city, // H
        formData.dealerName, // I
        timestamp, // J
      ];

      const params = new FormData();
      params.append("sheetName", "Login");
      params.append("action", "batchInsert");
      params.append("rowsData", JSON.stringify([rowData]));

      const response = await fetch(googleScriptUrl, {
        method: "POST",
        body: params,
      });

      const result = await response.json();

      if (result.success) {
        // Also save to UserData sheet
        const userParams = new FormData();
        userParams.append("sheetName", "UserData");
        userParams.append("action", "batchInsert");
        userParams.append("rowsData", JSON.stringify([rowData]));

        const userResponse = await fetch(googleScriptUrl, {
          method: "POST",
          body: userParams,
        });
        const userResult = await userResponse.json();

        if (userResult.success) {
          setShowSuccess(true);
        } else {
          setError(userResult.error || "Failed to save data to UserData database");
        }
      } else {
        setError(result.error || "Failed to save data to Login database");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-red-600/5 to-orange-600/5 pt-6 pb-4 px-6">
          <DialogTitle className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            Create New Account
          </DialogTitle>
          <p className="text-center text-slate-400 text-[11px] font-medium uppercase tracking-wider">
            Quick Registration
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-3 animate-in zoom-in-95 fade-in duration-300">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-50 shadow-sm">
                <Save className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-center space-y-3 w-full">
                <h3 className="text-lg font-bold text-slate-800">Registration Successful!</h3>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">User ID:</span>
                    <span className="text-sm font-bold text-red-600">{formData.phone}</span>
                  </div>
                  <div className="h-px bg-slate-200/50 w-full" />
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Password:</span>
                    <span className="text-sm font-bold text-red-600">{formData.phone}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <Button
                    onClick={() => onSuccess({ ...formData, name: formData.userName, pass: formData.phone })}
                    className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md font-bold text-sm"
                  >
                    OK
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 text-xs font-semibold text-center text-red-600 border border-red-100 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <User className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="User Name"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <Mail className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="gmail"
                    value={formData.gmail}
                    onChange={handleInputChange}
                    placeholder="Gmail"
                    type="email"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="relative group">
                  <CreditCard className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="UPI ID"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <MapPin className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="relative group">
                  <Store className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                  <Input
                    name="dealerName"
                    value={formData.dealerName}
                    onChange={handleInputChange}
                    placeholder="Dealer"
                    className="h-9 pl-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Password Field - Read Only with Show/Hide Toggle */}
              <div className="relative group">
                <Lock className="absolute w-3.5 h-3.5 transition-colors -translate-y-1/2 left-3 top-1/2 text-slate-300 group-focus-within:text-red-500" />
                <Input
                  name="pass"
                  value={formData.pass || formData.phone}
                  onChange={() => { }} // Read-only, no changes allowed
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (Auto-set to Phone Number)"
                  readOnly
                  className="h-9 pl-9 pr-9 text-xs border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500 bg-slate-50 cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                <p className="text-xs text-blue-700">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Password will be your Phone Number
                </p>
              </div>
            </>
          )}
        </div>

        {!showSuccess && (
          <DialogFooter className="flex gap-2 p-4 bg-slate-50/50 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border-slate-200 hover:bg-slate-50 text-xs font-semibold"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-9 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg shadow-md text-xs font-bold"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  Save Details
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}