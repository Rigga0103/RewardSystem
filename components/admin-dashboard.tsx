"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Gift,
  TrendingUp,
  Wallet,
  Loader2,
  Ticket,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";
const SHEET_NAME = "Coupons";

interface Coupon {
  id: number;
  created: string;
  code: string;
  status: string;
  reward: number;
  claimedBy: string | null;
  claimedAt: string | null;
  rowIndex: number;
}

// Format date to DD-MM-YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      return dateStr;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

interface CouponTableProps {
  coupons: Coupon[];
  emptyMessage: string;
  showClaimInfo?: boolean;
  onDelete: (coupon: Coupon) => void;
}

const CouponTable = ({
  coupons,
  emptyMessage,
  showClaimInfo = true,
  onDelete,
}: CouponTableProps) => (
  <div className="h-full">
    {/* Desktop Table */}
    <div className="hidden lg:block">
      {coupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <Gift className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
            <div
              className={`grid ${
                showClaimInfo ? "grid-cols-7" : "grid-cols-5"
              } gap-4 text-xs font-medium text-white uppercase tracking-wider`}
            >
              <div>Code</div>
              <div>Status</div>
              <div>Reward</div>
              <div>Created</div>
              {showClaimInfo && <div>Claimed By</div>}
              {showClaimInfo && <div>Claimed At</div>}
              <div className="text-center">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="max-h-80 overflow-y-auto bg-white divide-y divide-gray-50">
            {coupons.map((coupon, index) => (
              <div
                key={coupon.id}
                className={`grid ${
                  showClaimInfo ? "grid-cols-7" : "grid-cols-5"
                } gap-4 px-5 py-3.5 items-center hover:bg-red-50/30 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                <div className="font-mono text-sm font-semibold text-slate-800 tracking-wide">
                  {coupon.code}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      coupon.status === "used"
                        ? "bg-green-100 text-green-700"
                        : coupon.status === "deleted"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        coupon.status === "used"
                          ? "bg-green-500"
                          : coupon.status === "deleted"
                          ? "bg-gray-400"
                          : "bg-red-500"
                      }`}
                    />
                    {coupon.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  ₹{coupon.reward}
                </div>
                <div className="text-sm text-slate-500">
                  {formatDate(coupon.created)}
                </div>
                {showClaimInfo && (
                  <div className="text-sm text-slate-500">
                    {coupon.claimedBy || "—"}
                  </div>
                )}
                {showClaimInfo && (
                  <div className="text-sm text-slate-500">
                    {coupon.claimedAt ? formatDate(coupon.claimedAt) : "—"}
                  </div>
                )}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(coupon)}
                    disabled={
                      coupon.status === "used" || coupon.status === "deleted"
                    }
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50 border-t border-gray-100 px-5 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {coupons.length}
                </span>{" "}
                coupons
              </span>
              <span className="text-slate-400 text-xs">
                Total Value:{" "}
                <span className="font-semibold text-red-600">
                  ₹{coupons.reduce((sum, c) => sum + Number(c.reward), 0)}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Mobile Card View */}
    <div className="lg:hidden space-y-2 max-h-80 overflow-y-auto">
      {coupons.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
            <Gift className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-mono text-sm font-bold text-slate-800 mb-1">
                  {coupon.code}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    coupon.status === "used"
                      ? "bg-green-100 text-green-700"
                      : coupon.status === "deleted"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {coupon.status}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  ₹{coupon.reward}
                </div>
                <div className="text-xs text-slate-400">
                  {formatDate(coupon.created)}
                </div>
              </div>
            </div>

            {coupon.claimedBy && (
              <div className="text-xs text-slate-500 mb-2">
                Claimed by:{" "}
                <span className="text-slate-700">{coupon.claimedBy}</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(coupon)}
              disabled={coupon.status === "used" || coupon.status === "deleted"}
              className="w-full h-8 text-xs border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-30"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Delete
            </Button>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function PremiumAdminDashboard() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [batchSize, setBatchSize] = useState<number | string>("");
  const [rewardAmount, setRewardAmount] = useState<number | string>("");
  const [activeTab, setActiveTab] = useState("unused");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const generateUniqueCode = (existingCodes: Set<string>): string => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const numbers = "23456789";
    const special = "@#$%&*!";
    const allChars = uppercase + lowercase + numbers + special;

    let code: string;
    let attempts = 0;
    const maxAttempts = 10000;

    do {
      code = "";
      // Ensure at least one of each type
      code += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      code += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      code += special.charAt(Math.floor(Math.random() * special.length));

      // Fill remaining 6 characters with mix
      for (let i = 0; i < 6; i++) {
        code += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }

      // Shuffle the code
      code = code
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");

      attempts++;
      if (attempts > maxAttempts) {
        throw new Error(
          "Unable to generate unique code after maximum attempts"
        );
      }
    } while (existingCodes.has(code));

    return code;
  };

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const couponData: Coupon[] = result.data
          .slice(1)
          .map((row: (string | number | null)[], index: number) => ({
            id: index + 1,
            created: row[0] || "",
            code: row[1] || "",
            status: row[2] || "unused",
            reward: row[3] || 0,
            claimedBy: row[4] || null,
            claimedAt: row[5] || null,
            rowIndex: index + 2,
          }))
          .filter((coupon: Coupon) => coupon.code);

        setCoupons(couponData);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      alert("Error fetching coupons from Google Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  const submitBatchToSheet = async (rowsData: (string | number)[][]) => {
    const formData = new FormData();
    formData.append("sheetName", SHEET_NAME);
    formData.append("action", "batchInsert");
    formData.append("rowsData", JSON.stringify(rowsData));

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to submit coupons");
    }

    return result;
  };

  // Delete row completely from Google Sheet
  const deleteRowFromSheet = async (rowIndex: number) => {
    const formData = new FormData();
    formData.append("sheetName", SHEET_NAME);
    formData.append("action", "delete");
    formData.append("rowIndex", rowIndex.toString());

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to delete coupon");
    }

    return result;
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const generateCoupons = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`
      );
      const result = await response.json();

      const existingCodes = new Set<string>();
      if (result.success && result.data) {
        result.data.slice(1).forEach((row: (string | number | null)[]) => {
          if (row[1]) existingCodes.add(String(row[1]));
        });
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const currentDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      const newCoupons: (string | number)[][] = [];

      const batchSizeNum =
        typeof batchSize === "number" ? batchSize : parseInt(batchSize) || 10;
      const rewardAmountNum =
        typeof rewardAmount === "number"
          ? rewardAmount
          : parseInt(rewardAmount) || 100;

      for (let i = 0; i < batchSizeNum; i++) {
        const uniqueCode = generateUniqueCode(existingCodes);
        existingCodes.add(uniqueCode);
        newCoupons.push([
          currentDate, // Col A: Creation Timestamp (YYYY-MM-DD HH:mm:ss)
          uniqueCode,
          "unused",
          rewardAmountNum,
          "",
          "",
        ]);
      }

      await submitBatchToSheet(newCoupons);

      await fetchCoupons();
      setIsDialogOpen(false);
      // Show success message for 5 seconds
      setSuccessMessage(`Successfully generated ${batchSizeNum} coupons!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error generating coupons:", error);
      alert(
        "Error generating coupons: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  // Confirm and delete coupon
  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRowFromSheet(couponToDelete.rowIndex);
      // Refresh the data from server to get correct row indices
      await fetchCoupons();
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert(
        "Error deleting coupon: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const usedCoupons = coupons.filter((c) => c.status === "used");
  const unusedCoupons = coupons.filter((c) => c.status === "unused");
  const totalCoupons = coupons.length;
  const totalRewards = usedCoupons.reduce(
    (sum, coupon) => sum + (Number(coupon.reward) || 0),
    0
  );

  if (isLoading && coupons.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Stats Cards - All with red theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Total
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {totalCoupons}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Used
              </p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">
                {usedCoupons.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Available
              </p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">
                {unusedCoupons.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Gift className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Rewards
              </p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">
                ₹{totalRewards}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Card */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Coupons
                </h2>
                <p className="text-xs text-slate-400">
                  Manage your reward codes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Generate Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/25 border-0"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      Generate Coupons
                    </DialogTitle>
                    <DialogDescription>
                      Create new coupon codes with specified reward amounts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="batchSize"
                        className="text-sm font-medium text-slate-700"
                      >
                        Batch Size
                      </Label>
                      <Input
                        id="batchSize"
                        type="number"
                        value={batchSize}
                        onChange={(e) =>
                          setBatchSize(
                            e.target.value === ""
                              ? ""
                              : Number.parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                        max="500"
                        placeholder="Enter batch size (e.g. 10)"
                        className="h-11 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="rewardAmount"
                        className="text-sm font-medium text-slate-700"
                      >
                        Reward Amount (₹)
                      </Label>
                      <Input
                        id="rewardAmount"
                        type="number"
                        value={rewardAmount}
                        onChange={(e) =>
                          setRewardAmount(
                            e.target.value === ""
                              ? ""
                              : Number.parseInt(e.target.value) || 100
                          )
                        }
                        min="1"
                        placeholder="Enter reward amount (e.g. 100)"
                        className="h-11 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <Button
                      onClick={generateCoupons}
                      disabled={isGenerating}
                      className="w-full h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate {batchSize} Coupons
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Tab Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("unused")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === "unused"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Unused ({unusedCoupons.length})
                </button>
                <button
                  onClick={() => setActiveTab("used")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === "used"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Used ({usedCoupons.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === "unused" && (
            <CouponTable
              coupons={unusedCoupons}
              emptyMessage="No unused coupons. Click Generate to create some."
              showClaimInfo={false}
              onDelete={openDeleteDialog}
            />
          )}
          {activeTab === "used" && (
            <CouponTable
              coupons={usedCoupons}
              emptyMessage="No coupons have been redeemed yet."
              showClaimInfo={true}
              onDelete={openDeleteDialog}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              Delete Coupon
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this coupon? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {couponToDelete && (
            <div className="bg-slate-50 rounded-xl p-4 my-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase">
                    Coupon Code
                  </p>
                  <p className="font-mono font-bold text-slate-800">
                    {couponToDelete.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase">Value</p>
                  <p className="font-bold text-red-600">
                    ₹{couponToDelete.reward}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteCoupon}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 pr-10 flex items-center gap-3 min-w-[300px] relative">
            <div className="bg-green-100 rounded-full p-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Success</p>
              <p className="text-sm text-slate-500">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
