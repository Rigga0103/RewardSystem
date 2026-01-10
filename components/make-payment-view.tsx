"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle2,
  Wallet,
  IndianRupee,
  Send,
  AlertCircle,
} from "lucide-react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";
const COUPONS_SHEET = "Coupons";

interface PaymentItem {
  id: string;
  createdDate: string;
  code: string;
  reward: number;
  claimedBy: string;
  phone: string;
  upiId: string;
  claimedAt: string;
  paymentStatus: string;
  rowIndex: number;
  rawRow: any[]; // Store original row data to preserve all columns
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

export default function MakePaymentView() {
  const [allItems, setAllItems] = useState<PaymentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number>(0);

  const fetchPaymentData = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${COUPONS_SHEET}&action=fetch&t=${timestamp}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const paymentData = result.data
          .slice(1)
          .map((row: any[], index: number) => ({
            id: `payment_${index + 1}`,
            // Column mapping:
            // A (0): Created Date
            // B (1): Code
            // D (3): Reward
            // E (4): Claimed By
            // F (5): Claimed At
            // G (6): Phone
            // H (7): UPI ID
            // I (8): Payment Status
            createdDate: row[0] || "",
            code: row[1] ? row[1].toString().trim() : "",
            reward: Number.parseFloat(row[3]) || 0,
            claimedBy: row[4] || "",
            claimedAt: row[5] || "",
            phone: row[6] || "",
            upiId: row[7] || "",
            paymentStatus: row[8] || "",
            rowIndex: index + 2, // +2 because of 0-indexing and header row
            rawRow: row, // Store original row to preserve all column data
          }));

        setAllItems(paymentData);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      alert("Error fetching payment data from Google Sheets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const refreshData = async () => {
    setSelectedItems([]);
    await fetchPaymentData();
  };

  // Pending items: Column H (upiId) not empty AND Column I (paymentStatus) is empty
  const pendingItems = allItems.filter(
    (item) =>
      item.upiId &&
      item.upiId.trim() !== "" &&
      (!item.paymentStatus || item.paymentStatus.trim() === "")
  );

  // History items: Column H (upiId) not empty AND Column I (paymentStatus) is not empty
  const historyItems = allItems.filter(
    (item) =>
      item.upiId &&
      item.upiId.trim() !== "" &&
      item.paymentStatus &&
      item.paymentStatus.trim() !== ""
  );

  // Filter based on search
  const filterItems = (items: PaymentItem[]) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.claimedBy.toLowerCase().includes(term) ||
        item.phone.toLowerCase().includes(term) ||
        item.upiId.toLowerCase().includes(term)
    );
  };

  const filteredPendingItems = filterItems(pendingItems);
  const filteredHistoryItems = filterItems(historyItems);

  const toggleItemSelection = (code: string) => {
    setSelectedItems((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAllPending = () => {
    if (selectedItems.length === filteredPendingItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPendingItems.map((item) => item.code));
    }
  };

  // Open confirmation dialog
  const openConfirmDialog = () => {
    if (selectedItems.length === 0) {
      return;
    }
    setConfirmDialogOpen(true);
  };

  // Actual submit after confirmation
  const confirmAndSubmit = async () => {
    setConfirmDialogOpen(false);
    setIsSubmitting(true);
    try {
      // Use Promise.all for parallel updates (2x faster)
      const updatePromises = selectedItems.map((code) => {
        const item = pendingItems.find((p) => p.code === code);
        if (!item) return Promise.resolve();

        // Use markDeleted action to ONLY update Column I (column 9) - no other columns affected
        const updateParams = new URLSearchParams({
          sheetName: COUPONS_SHEET,
          action: "markDeleted",
          rowIndex: item.rowIndex.toString(),
          columnIndex: "9", // Column I (1-indexed)
          value: "Done",
        });

        return fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: updateParams.toString(),
        });
      });

      // Wait for all updates to complete in parallel
      await Promise.all(updatePromises);

      setSuccessCount(selectedItems.length);
      setSelectedItems([]);
      await fetchPaymentData();
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const totalPending = pendingItems.length;
  const totalProcessed = historyItems.length;
  const totalPendingAmount = pendingItems.reduce(
    (sum, item) => sum + item.reward,
    0
  );
  const totalProcessedAmount = historyItems.reduce(
    (sum, item) => sum + item.reward,
    0
  );

  if (isLoading && allItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pending
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {totalPending}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-orange-600 mt-0.5">
                ₹{totalPendingAmount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Processed
              </p>
              <p className="text-2xl font-bold text-green-600 mt-0.5">
                {totalProcessed}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Paid Amount
              </p>
              <p className="text-2xl font-bold text-green-600 mt-0.5">
                ₹{totalProcessedAmount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Make Payment
                </h2>
                <p className="text-xs text-slate-400">
                  Process pending reward payments
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-grow lg:flex-grow-0 lg:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === "pending"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Pending ({totalPending})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === "history"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  History ({totalProcessed})
                </button>
              </div>

              {activeTab === "pending" && selectedItems.length > 0 && (
                <Button
                  onClick={openConfirmDialog}
                  size="sm"
                  className="h-9 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting
                    ? "Processing..."
                    : `Submit (${selectedItems.length})`}
                </Button>
              )}

              <Button
                onClick={refreshData}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:text-red-600"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-4">
          {activeTab === "pending" ? (
            /* Pending Section */
            <>
              {/* Desktop Table */}
              <div className="hidden lg:flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-5 py-3 flex-shrink-0">
                  <div className="grid grid-cols-8 gap-4 text-xs font-medium text-white uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filteredPendingItems.length > 0 &&
                          selectedItems.length === filteredPendingItems.length
                        }
                        onCheckedChange={selectAllPending}
                        className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-orange-600"
                      />
                      Action
                    </div>
                    <div>Created Date</div>
                    <div>Code</div>
                    <div>Reward</div>
                    <div>Claimed By</div>
                    <div>Phone</div>
                    <div>UPI Id</div>
                    <div>Claimed At</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {filteredPendingItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        No pending payments found.
                      </p>
                    </div>
                  ) : (
                    filteredPendingItems.map((item, index) => (
                      <div
                        key={item.code}
                        className={`grid grid-cols-8 gap-4 px-5 py-3.5 items-center hover:bg-orange-50/30 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedItems.includes(item.code)}
                            onCheckedChange={() =>
                              toggleItemSelection(item.code)
                            }
                            className="border-slate-300"
                          />
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(item.createdDate)}
                        </div>
                        <div className="font-mono text-sm font-semibold text-slate-800 tracking-wide">
                          {item.code}
                        </div>
                        <div className="text-sm font-bold text-slate-700">
                          ₹{item.reward}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.claimedBy}
                        >
                          {item.claimedBy || "—"}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.phone}
                        >
                          {item.phone || "—"}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.upiId}
                        >
                          {item.upiId || "—"}
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(item.claimedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Table Footer */}
                <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {selectedItems.length > 0 ? (
                        <>
                          <span className="font-semibold text-orange-600">
                            {selectedItems.length}
                          </span>{" "}
                          selected
                        </>
                      ) : (
                        <>
                          Showing{" "}
                          <span className="font-semibold text-slate-700">
                            {filteredPendingItems.length}
                          </span>{" "}
                          pending payments
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 overflow-y-auto flex-1">
                {filteredPendingItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      No pending payments.
                    </p>
                  </div>
                ) : (
                  filteredPendingItems.map((item) => (
                    <Card
                      key={item.code}
                      className="border border-orange-100 bg-white shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedItems.includes(item.code)}
                              onCheckedChange={() =>
                                toggleItemSelection(item.code)
                              }
                              className="border-slate-300"
                            />
                            <div>
                              <p className="font-mono font-bold text-slate-800">
                                {item.code}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatDate(item.createdDate)}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-orange-600">
                            ₹{item.reward}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-slate-400">Claimed By</p>
                            <p className="text-slate-600 truncate">
                              {item.claimedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Phone</p>
                            <p className="text-slate-600 truncate">
                              {item.phone || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">UPI Id</p>
                            <p className="text-slate-600 truncate">
                              {item.upiId || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Claimed At</p>
                            <p className="text-slate-600">
                              {formatDate(item.claimedAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            /* History Section */
            <>
              {/* Desktop Table */}
              <div className="hidden lg:flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-3 flex-shrink-0">
                  <div className="grid grid-cols-8 gap-4 text-xs font-medium text-white uppercase tracking-wider">
                    <div>Created Date</div>
                    <div>Code</div>
                    <div>Reward</div>
                    <div>Claimed By</div>
                    <div>Phone</div>
                    <div>UPI Id</div>
                    <div>Claimed At</div>
                    <div>Status</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {filteredHistoryItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        No payment history found.
                      </p>
                    </div>
                  ) : (
                    filteredHistoryItems.map((item, index) => (
                      <div
                        key={item.code}
                        className={`grid grid-cols-8 gap-4 px-5 py-3.5 items-center hover:bg-green-50/30 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <div className="text-sm text-slate-500">
                          {formatDate(item.createdDate)}
                        </div>
                        <div className="font-mono text-sm font-semibold text-slate-800 tracking-wide">
                          {item.code}
                        </div>
                        <div className="text-sm font-bold text-slate-700">
                          ₹{item.reward}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.claimedBy}
                        >
                          {item.claimedBy || "—"}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.phone}
                        >
                          {item.phone || "—"}
                        </div>
                        <div
                          className="text-sm text-slate-500 truncate"
                          title={item.upiId}
                        >
                          {item.upiId || "—"}
                        </div>
                        <div className="text-sm text-slate-500">
                          {formatDate(item.claimedAt)}
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500" />
                            {item.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Table Footer */}
                <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {filteredHistoryItems.length}
                      </span>{" "}
                      completed payments
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 overflow-y-auto flex-1">
                {filteredHistoryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      No payment history.
                    </p>
                  </div>
                ) : (
                  filteredHistoryItems.map((item) => (
                    <Card
                      key={item.code}
                      className="border border-green-100 bg-white shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-mono font-bold text-slate-800">
                              {item.code}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(item.createdDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">
                              ₹{item.reward}
                            </span>
                            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {item.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-slate-400">Claimed By</p>
                            <p className="text-slate-600 truncate">
                              {item.claimedBy || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Phone</p>
                            <p className="text-slate-600 truncate">
                              {item.phone || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">UPI Id</p>
                            <p className="text-slate-600 truncate">
                              {item.upiId || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Claimed At</p>
                            <p className="text-slate-600">
                              {formatDate(item.claimedAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-orange-600" />
              </div>
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark {selectedItems.length} payment(s) as
              Done?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-orange-50 rounded-xl p-4 my-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Selected Items
                </p>
                <p className="font-bold text-slate-800">
                  {selectedItems.length} payment(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase">Total Amount</p>
                <p className="font-bold text-orange-600">
                  ₹
                  {pendingItems
                    .filter((item) => selectedItems.includes(item.code))
                    .reduce((sum, item) => sum + item.reward, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAndSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              Success!
            </DialogTitle>
            <DialogDescription>
              {successCount} payment(s) have been marked as Done successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 rounded-xl p-6 my-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-green-700 font-semibold">Payment Processed</p>
            <p className="text-green-600 text-sm">
              Items moved to History section
            </p>
          </div>
          <Button
            onClick={() => setSuccessDialogOpen(false)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
