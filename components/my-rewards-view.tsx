"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Calendar, CheckCircle2, Clock } from "lucide-react";

interface Reward {
  created: string;
  code: string;
  status: string;
  amount: string;
  claimedAt: string;
  makePayment: string;
  remark: string;
  sn: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

export default function MyRewardsView({ userPhone }: { userPhone: string }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec?sheet=Coupons&action=fetch`,
        );
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          const headers = data.data[0].map((h: any) => h ? String(h).trim().toLowerCase() : "");
          
          let phoneIndex = headers.findIndex((h: string) => h === "phone number" || h === "phone" || h === "mobile" || h === "mobile number");
          if (phoneIndex === -1) phoneIndex = 6;

          let snIndex = headers.findIndex((h: string) => 
            h === "serial no" || h === "serialno" || h === "sn" || h === "sl no" || h === "sl.no" || h === "s.no" || h === "sno"
          );
          if (snIndex === -1) snIndex = 13;

          let makePaymentIndex = headers.findIndex((h: string) => h === "make payment" || h === "payment status" || h === "payment");
          if (makePaymentIndex === -1) makePaymentIndex = 8;

          let remarkIndex = headers.indexOf("remark");
          if (remarkIndex === -1) remarkIndex = 12;

          const userRewards = data.data
            .slice(1) // skip headers
            .filter((row: any) => String(row[phoneIndex] || "").trim() === String(userPhone).trim())
            .map((row: any) => ({
              created: row[0] || "",
              code: row[1] || "",
              status: row[2] || "unused",
              amount: row[3] || 0,
              claimedAt: row[5] || "",
              makePayment: row[makePaymentIndex] || "",
              remark: row[remarkIndex] || "",
              sn: row[snIndex] || "",
            }));
          setRewards(userRewards);
        }
      } catch (err) {
        console.error("Error fetching rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [userPhone]);

  const totalClaimedAmount = rewards.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  const receivedRewards = rewards.filter(
    (r) => r.makePayment && r.makePayment.trim() !== "",
  );

  const totalReceivedAmount = receivedRewards.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            My Rewards
          </h2>
          <p className="text-slate-500 text-sm">
            View and track all your claimed rewards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-5 bg-green-50 rounded-lg">
                <p className="text-xlg text-slate-500 mt-1">Reward Claimed</p>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="pl-5">
              <div className="text-3xl font-bold text-slate-800">
                <span className="text-xl inline">No. of Coupons</span> {rewards.length}
              </div>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">
                Total Amount: <span className="font-bold text-green-600">₹{totalClaimedAmount}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-5 bg-blue-50 rounded-lg">
                <p className="text-xlg text-slate-500 mt-1">Reward Received</p>
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="pl-5">
              <div className="text-3xl font-bold text-slate-800">
                <span className="text-xl inline">No. of Coupons</span>  {receivedRewards.length}
              </div>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">
                Total Amount: <span className="font-bold text-blue-600">₹{totalReceivedAmount}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-800">
            Recent Claims
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No rewards claimed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      SN
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Coupon Code
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Remark
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rewards.map((reward, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-500">
                          {reward.sn || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {formatDate(reward.claimedAt || reward.created)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-slate-800">
                          {reward.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600">
                          ₹{reward.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 italic">
                          {reward.remark || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${reward.status === "used"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {reward.status === "used"
                            ? reward.makePayment === "Done"
                              ? "Reward Transferred🎉"
                              : "Used"
                            : reward.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
