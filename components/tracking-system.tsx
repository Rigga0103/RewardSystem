"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  RefreshCw,
  QrCode,
  Eye,
  Loader2,
  Ticket,
  TrendingUp,
  Gift,
  Wallet,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";
const COUPONS_SHEET = "Coupons";
const CONSUMERS_SHEET = "User_Claimed_Coupon";

interface Coupon {
  id: string;
  created: string;
  code: string;
  status: "used" | "unused" | "deleted";
  reward: number;
  phone?: string;
  upiId?: string;
  claimedBy?: string;
  claimedAt?: string;
  rowIndex: number;
}

interface Consumer {
  name: string;
  phone: string;
  upiId: string;
  couponCode: string;
  date: string;
  rowIndex: number;
}

interface BarcodeDisplayProps {
  code: string;
  formLink: string;
  reward: number;
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

const BarcodeDisplay = ({ code, formLink, reward }: BarcodeDisplayProps) => {
  return (
    <div className="flex flex-col items-center p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <QRCodeSVG
          value={formLink}
          size={160}
          level="H"
          includeMargin={true}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>
      <div className="text-sm font-mono font-bold text-gray-900 mb-2 bg-gray-100 px-3 py-1.5 rounded-full">
        {code}
      </div>
      <div className="text-xs text-gray-500 break-all max-w-[180px] text-center mb-2 bg-gray-50 p-2 rounded">
        {formLink}
      </div>
      <div className="text-sm text-red-700 font-semibold bg-red-100 px-3 py-1.5 rounded-full">
        ₹{reward} Reward
      </div>
    </div>
  );
};

export default function PremiumTrackingSystem() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "used" | "unused">(
    "all"
  );
  const [showBarcodes, setShowBarcodes] = useState<boolean>(false);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${COUPONS_SHEET}&action=fetch&t=${timestamp}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const couponData = result.data
          .slice(1)
          .map((row: any[], index: number) => ({
            id: `coupon_${index + 1}`,
            // Mapping per user request:
            // Col A (0): Create Date -> created
            // Col B (1): Code -> code
            // Col C (2): Status -> status
            // Col D (3): Reward -> reward
            // Col E (4): Claimed By -> claimedBy
            // Col F (5): Claimed At -> claimedAt (Date)
            // Col G (6): Phone Number -> phone
            // Col H (7): UPI ID -> upiId
            created: row[0] || "",
            code: row[1] ? row[1].toString().trim() : "",
            status: (row[2] || "unused").toLowerCase(),
            reward: Number.parseFloat(row[3]) || 0,
            claimedBy: row[4] || null,
            claimedAt: row[5] || null,
            phone: row[6] || null,
            upiId: row[7] || null,
            rowIndex: index + 2,
          }))
          .filter(
            (coupon: Coupon) => coupon.code && coupon.status !== "deleted"
          );

        setCoupons(couponData);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      alert("Error fetching coupons from Google Sheets");
    }
  };

  const fetchConsumers = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=${CONSUMERS_SHEET}&action=fetch&t=${timestamp}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        const consumerData = result.data
          .slice(1)
          .map((row: any[], index: number) => ({
            // User_Claimed_Coupon Structure:
            // 0: Timestamp
            // 1: Serial
            // 2: Coupon Code
            // 3: Name
            // 4: Phone
            // 5: UPI ID
            name: row[3] || "",
            phone: row[4] || "",
            upiId: row[5] || "",
            couponCode: row[2] ? row[2].toString().trim() : "",
            date: row[0] || "",
            rowIndex: index + 2,
          }))
          .filter((consumer: Consumer) => consumer.name && consumer.couponCode);

        setConsumers(consumerData);
      }
    } catch (error) {
      console.error("Error fetching consumers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchCoupons();
      await fetchConsumers();
    };
    fetchData();
  }, []);

  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    await fetchCoupons();
    await fetchConsumers();
  };

  const getFormLink = (couponCode: string): string => {
    return `${window.location.origin}/redeem?code=${couponCode}`;
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-ignore
  const downloadBarcodes = async (): Promise<void> => {
    const barcodesToDownload =
      selectedCoupons.length > 0
        ? coupons.filter((c) => selectedCoupons.includes(c.code))
        : coupons.filter((c) => c.status === "unused");

    if (barcodesToDownload.length === 0) {
      alert("No coupons selected to download.");
      return;
    }

    try {
      setIsDownloading(true);
      // Yield to main thread to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Dynamically import libraries to avoid SSR issues if necessary,
      // though standard import works if we are sure this runs on client.
      // We'll use the imported modules.
      // const { default: jsPDF } = await import("jspdf");
      // const QRCode = await import("qrcode");

      // A4 size: 210mm x 297mm
      const doc = new jsPDF();
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const cols = 3;
      const colWidth = (pageWidth - margin * 2) / cols;
      const rowHeight = 65; // Height reserved for each QR block

      let x = margin;
      let y = margin + 10; // Start a bit lower to leave room for header
      let colIndex = 0;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text("Coupon QR Codes", pageWidth / 2, margin, { align: "center" });

      for (const coupon of barcodesToDownload) {
        // Check if we need a new page
        // If current y + rowHeight exceeds pageHeight - margin
        if (y + rowHeight > pageHeight - margin) {
          doc.addPage();
          y = margin + 10;
          x = margin;
          colIndex = 0;
        }

        const formLink = getFormLink(coupon.code);

        // Generate QR Code Data URL
        const qrDataUrl = await QRCode.toDataURL(formLink, {
          width: 200,
          margin: 1,
          color: {
            dark: "#000000", // Black QR code
            light: "#ffffff",
          },
        });

        // Calculate center of the column
        const colCenterX = x + colWidth / 2;

        // Draw Border for item (optional, purely aesthetic)
        // doc.setDrawColor(229, 231, 235); // Gray-200
        // doc.rect(x + 2, y, colWidth - 4, rowHeight - 4, "S");

        // Add QR Image
        // Image size 40x40 mm
        doc.addImage(qrDataUrl, "PNG", colCenterX - 20, y + 5, 40, 40);

        // Show Reward Price
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Rs. ${coupon.reward}`, colCenterX, y + 50, {
          align: "center",
        });

        // Move to next position
        colIndex++;
        if (colIndex >= cols) {
          colIndex = 0;
          x = margin;
          y += rowHeight;
        } else {
          x += colWidth;
        }
      }

      doc.save("coupons.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleCouponSelection = (couponCode: string): void => {
    setSelectedCoupons((prev) =>
      prev.includes(couponCode)
        ? prev.filter((code) => code !== couponCode)
        : [...prev, couponCode]
    );
  };

  const selectAllUnused = (): void => {
    const unusedCodes = coupons
      .filter((c) => c.status === "unused")
      .map((c) => c.code);
    setSelectedCoupons(unusedCodes);
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.claimedBy &&
        coupon.claimedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" || coupon.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort by date (newest first)
  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    const timeA = a.created ? new Date(a.created).getTime() : 0;
    const timeB = b.created ? new Date(b.created).getTime() : 0;
    return timeB - timeA;
  });

  const totalCoupons = coupons.length;
  const usedCouponsValues = coupons.filter((c) => c.status === "used").length;
  const unusedCouponsValues = coupons.filter(
    (c) => c.status === "unused"
  ).length;
  const totalRewards = coupons
    .filter((c) => c.status === "used")
    .reduce((sum, coupon) => sum + coupon.reward, 0);

  const exportData = (): void => {
    const csvContent = [
      [
        "Coupon Code",
        "Status",
        "Claimed By",
        "Phone",
        "UPI ID",
        "Claimed At",
        "Reward Amount",
        "Form Link",
      ],
      ...coupons.map((coupon) => [
        coupon.code,
        coupon.status,
        coupon.reward,
        coupon.claimedBy ||
          consumers.find(
            (c) => c.couponCode.toLowerCase() === coupon.code.toLowerCase()
          )?.name ||
          "",
        coupon.phone ||
          consumers.find(
            (c) => c.couponCode.toLowerCase() === coupon.code.toLowerCase()
          )?.phone ||
          "",
        coupon.upiId ||
          consumers.find(
            (c) => c.couponCode.toLowerCase() === coupon.code.toLowerCase()
          )?.upiId ||
          "",
        coupon.claimedAt ||
          consumers.find(
            (c) => c.couponCode.toLowerCase() === coupon.code.toLowerCase()
          )?.date ||
          "",
        coupon.status === "used" ? `₹${coupon.reward}` : "₹0",
        getFormLink(coupon.code),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coupon-tracking-data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && coupons.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">Loading tracking data...</p>
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
                Redeemed
              </p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">
                {usedCouponsValues}
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
                {unusedCouponsValues}
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
                Distributed
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

      {/* Main Tracking Card - Fills remaining space */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Tracking System
                </h2>
                <p className="text-xs text-slate-400">
                  Overview of all coupons and redemptions
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

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "all"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("used")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "used"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Used
                </button>
                <button
                  onClick={() => setFilterStatus("unused")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    filterStatus === "unused"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Unused
                </button>
              </div>

              <Button
                onClick={() => {
                  if (!showBarcodes) {
                    setFilterStatus("unused");
                  } else {
                    setFilterStatus("all");
                  }
                  setShowBarcodes(!showBarcodes);
                }}
                variant="outline"
                size="sm"
                className="h-9 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showBarcodes ? "Hide" : "Show"} QR
              </Button>

              <Button
                onClick={downloadBarcodes}
                size="sm"
                className="h-9 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? "Generating..." : "Download"}
              </Button>

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
          {/* QR Codes Grid - Only shows when showBarcodes is true */}
          {showBarcodes ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800">
                  Unused Coupon QR Codes
                </h3>
                <span className="text-sm text-slate-500">
                  Showing {coupons.filter((c) => c.status === "unused").length}{" "}
                  codes
                </span>
              </div>
              {coupons.filter((c) => c.status === "unused").length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {coupons
                    .filter((c) => c.status === "unused")
                    .map((coupon) => (
                      <BarcodeDisplay
                        key={coupon.code}
                        code={coupon.code}
                        formLink={getFormLink(coupon.code)}
                        reward={coupon.reward}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-medium mb-1">
                    No Unused Coupons
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Create some coupons in the dashboard to see them here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Table and Mobile Cards - Only shows when showBarcodes is false */
            <>
              {/* Desktop Table Container */}
              <div className="hidden lg:flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header - Fixed */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 flex-shrink-0">
                  <div className="grid grid-cols-7 gap-4 text-xs font-medium text-white uppercase tracking-wider">
                    <div>Code</div>
                    <div>Status</div>
                    <div>Reward</div>
                    <div>Claimed By</div>
                    <div>Phone</div>
                    <div>UPI ID</div>
                    <div>Claimed At</div>
                  </div>
                </div>

                {/* Table Body - Scrollable */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {sortedCoupons.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-slate-500 text-sm">
                        No coupons found matching your filters.
                      </p>
                    </div>
                  ) : (
                    sortedCoupons.map((coupon, index) => {
                      const consumer = consumers.find(
                        (c) =>
                          c.couponCode.toLowerCase() ===
                          coupon.code.toLowerCase()
                      );
                      return (
                        <div
                          key={coupon.code}
                          className={`grid grid-cols-7 gap-4 px-5 py-3.5 items-center hover:bg-red-50/10 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                        >
                          <div className="font-mono text-sm font-semibold text-slate-800 tracking-wide">
                            {coupon.code}
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                coupon.status === "used"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  coupon.status === "used"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {coupon.status === "used"
                                ? "Redeemed"
                                : "Available"}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-700">
                            ₹{coupon.reward}
                          </div>
                          <div
                            className="text-sm text-slate-500 truncate"
                            title={coupon.claimedBy || consumer?.name || ""}
                          >
                            {coupon.claimedBy || consumer?.name || "—"}
                          </div>
                          <div
                            className="text-sm text-slate-500 truncate"
                            title={coupon.phone || consumer?.phone}
                          >
                            {coupon.phone || consumer?.phone || "—"}
                          </div>
                          <div
                            className="text-sm text-slate-500 truncate"
                            title={coupon.upiId || consumer?.upiId}
                          >
                            {coupon.upiId || consumer?.upiId || "—"}
                          </div>
                          <div className="text-sm text-slate-500">
                            {formatDate(
                              coupon.claimedAt ||
                                consumer?.date ||
                                coupon.created
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Table Footer - Fixed */}
                <div className="bg-slate-50 border-t border-gray-100 px-5 py-3 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Showing{" "}
                      <span className="font-semibold text-slate-700">
                        {sortedCoupons.length}
                      </span>{" "}
                      coupons
                    </span>
                    <span className="text-slate-400 text-xs text-right">
                      Scroll for more
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 overflow-y-auto flex-1">
                {sortedCoupons.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-slate-500 text-sm">No coupons found.</p>
                  </div>
                ) : (
                  sortedCoupons.map((coupon) => {
                    const consumer = consumers.find(
                      (c) =>
                        c.couponCode.toLowerCase() === coupon.code.toLowerCase()
                    );
                    return (
                      <Card
                        key={coupon.code}
                        className={`border shadow-sm transition-all ${
                          coupon.status === "used"
                            ? "border-gray-100 bg-gray-50/50"
                            : "border-red-100 bg-white shadow-red-100/20"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedCoupons.includes(coupon.code)}
                                onChange={() =>
                                  toggleCouponSelection(coupon.code)
                                }
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-5 h-5"
                              />
                              <div>
                                <div className="font-mono text-base font-bold text-slate-800 tracking-wide">
                                  {coupon.code}
                                </div>
                                <span
                                  className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    coupon.status === "used"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {coupon.status === "used"
                                    ? "Redeemed"
                                    : "Available"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-lg font-bold ${
                                  coupon.status === "used"
                                    ? "text-slate-500"
                                    : "text-red-600"
                                }`}
                              >
                                ₹{coupon.reward}
                              </span>
                            </div>
                          </div>

                          {/* Data Grid with robust fallbacks */}
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100/80 text-sm">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                                Claimed By
                              </span>
                              <span className="font-medium text-slate-700 block truncate">
                                {coupon.claimedBy || consumer?.name || "—"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                                Date
                              </span>
                              <span className="font-medium text-slate-700 block truncate">
                                {formatDate(
                                  coupon.claimedAt ||
                                    consumer?.date ||
                                    coupon.created
                                )}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                                Phone
                              </span>
                              <span className="font-medium text-slate-700 block truncate font-mono text-xs">
                                {coupon.phone || consumer?.phone || "—"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                                UPI ID
                              </span>
                              <span className="font-medium text-slate-700 block truncate">
                                {coupon.upiId || consumer?.upiId || "—"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
