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
          `https://script.google.com/macros/s/AKfycbzx7TVAWVJjTrHLWQJ_nKorZy33kuJ5JcYRdQ0vIekPiWrQy1ZXFdmk0wy7EMf_wIpb/exec?sheet=Coupons&action=fetch`,
        );
        const data = await response.json();
        if (data.success && data.data) {
          // Headers: Created, Code, Status, Reward, Claimed By, Claimed At, Phone Number, ...
          const userRewards = data.data
            .slice(1) // skip headers
            .filter((row: any) => row[6] === userPhone) // filter by phone number (Col G)
            .map((row: any) => ({
              created: row[0],
              code: row[1],
              status: row[2],
              amount: row[3],
              claimedAt: row[5],
              makePayment: row[8] || "",
              remark: row[12] || "",
              sn: row[13] || "",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-orange-600 border-none shadow-lg shadow-red-200">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">
                <p className="text-3xl font-bold">
                  ₹
                  {rewards.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)}
                </p>
              </span>
            </div>

            <p className="text-lg text-red-100 mt-1">No. of coupens</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {rewards.length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Reward Claimed</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">
              {
                rewards.filter(
                  (r) => r.makePayment && r.makePayment.trim() !== "",
                ).length
              }
            </p>
            <p className="text-sm text-slate-500 mt-1">Reward Received</p>
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
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            reward.status === "used"
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
