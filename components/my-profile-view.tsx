"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, MapPin, Store, CreditCard, ShieldCheck } from "lucide-react";

interface UserProfile {
  name: string;
  phone: string;
  gmail: string;
  upi: string;
  city: string;
  dealer: string;
  role: string;
}

export default function MyProfileView({ userPhone }: { userPhone: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec?sheet=Login&action=fetch`
        );
        const data = await response.json();
        if (data.success && data.data) {
          // Headers: Serial No, User Name, Phone, Pass, Role, Gmail, UPI, City, Dealer Name, Timestamp
          const userRow = data.data.find((row: any) => row[2] === userPhone);
          if (userRow) {
            setProfile({
              name: userRow[1],
              phone: userRow[2],
              role: userRow[4],
              gmail: userRow[5],
              upi: userRow[6],
              city: userRow[7],
              dealer: userRow[8],
            });
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userPhone]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-slate-500">
        <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h2>
          <p className="text-slate-500 text-sm">Manage your personal information and account settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="h-24 bg-gradient-to-r from-red-600 to-orange-500" />
          <CardContent className="px-6 pb-6 -mt-12 text-center">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-3xl border-2 border-white">
                {profile.name.charAt(0)}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{profile.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{profile.role.toUpperCase()}</p>
            <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mx-auto w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified User
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <ProfileItem icon={<User className="w-4 h-4" />} label="Full Name" value={profile.name} />
              <ProfileItem icon={<Phone className="w-4 h-4" />} label="Phone Number" value={profile.phone} />
              <ProfileItem icon={<Mail className="w-4 h-4" />} label="Email Address" value={profile.gmail} />
              <ProfileItem icon={<CreditCard className="w-4 h-4" />} label="UPI ID" value={profile.upi} />
              <ProfileItem icon={<MapPin className="w-4 h-4" />} label="Location" value={profile.city} />
              <ProfileItem icon={<Store className="w-4 h-4" />} label="Dealer" value={profile.dealer} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-6 px-6 py-4 hover:bg-slate-50 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}
