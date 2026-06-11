"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Settings,
  UserPlus,
  Users,
  Shield,
  Key,
  Search,
  Filter,
  Trash2,
  X,
  User,
  MapPin,
  ChevronDown
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


interface User {
  serialNo: string;
  userName: string;
  phone: string;
  pass: string;
  role: string;
  gmail: string;
  upi: string;
  city: string;
  dealer: string;
  rowIndex: number;
}

export default function SettingsView() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    userName: "",
    phone: "",
    gmail: "",
    upiId: "",
    city: "",
    dealerName: "",
    pass: "",
    role: "User",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingSerial, setEditingSerial] = useState("");

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [nameFilter, setSearchNameFilter] = useState("All");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);


  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzfcdevw5wZLelGrr2tNvN6-wU_OmXdfaDR6tFsOlwSQtd9TAqw9qUv0lVjzBDF-6iO/exec";

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${GOOGLE_SCRIPT_URL}?sheet=Login&action=fetch`
      );
      const result = await response.json();
      if (result.success && result.data) {
        const parsedUsers = result.data
          .slice(1)
          .map((row: string[], index: number) => ({
            serialNo: row[0] || "",
            userName: row[1] || "",
            phone: row[2] || "",
            pass: row[3] || "",
            role: row[4] || "",
            gmail: row[5] || "",
            upi: row[6] || "",
            city: row[7] || "",
            dealer: row[8] || "",
            rowIndex: index + 2,
          }));
        setUsers(parsedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddUser = async () => {
    setIsSaving(true);
    try {
      let serialNo = editingSerial;
      let action = "update";

      if (!isEditing) {
        let maxNum = 0;
        users.forEach((user) => {
          const match = user.serialNo.match(/SN-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = maxNum + 1;
        serialNo = `SN-${String(nextNum).padStart(3, "0")}`;
        action = "insert";
      }

      const now = new Date();
      const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const submitParams = new URLSearchParams({
        sheetName: "Login",
        action: action,
        matchColumn: "A",
        matchValue: serialNo,
        rowData: JSON.stringify([
          serialNo,
          formData.userName,
          formData.phone,
          formData.pass,
          formData.role,
          formData.gmail,
          formData.upiId,
          formData.city,
          formData.dealerName,
          timestamp,
        ]),
      });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: submitParams.toString(),
      });

      const result = await response.json();
      if (result.success) {
        resetForm();
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        alert("Failed to save user: " + result.message);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userName: "",
      phone: "",
      gmail: "",
      upiId: "",
      city: "",
      dealerName: "",
      pass: "",
      role: "User",
    });
    setIsEditing(false);
    setEditingSerial("");
  };

  const handleEditClick = (user: User) => {
    setFormData({
      userName: user.userName,
      phone: user.phone,
      gmail: user.gmail,
      upiId: user.upi,
      city: user.city,
      dealerName: user.dealer,
      pass: user.pass,
      role: user.role,
    });
    setIsEditing(true);
    setEditingSerial(user.serialNo);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (serialNo: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setIsLoading(true);
    try {
      const submitParams = new URLSearchParams({
        sheetName: "Login",
        action: "delete",
        matchColumn: "A",
        matchValue: serialNo,
      });
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: submitParams.toString(),
      });
      const result = await response.json();
      if (result.success) fetchUsers();
      else alert("Delete failed: " + result.message);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      String(user.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.serialNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.gmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.dealer || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesCity = cityFilter === "All" || user.city === cityFilter;
    const matchesName = nameFilter === "All" || user.userName === nameFilter;

    return matchesSearch && matchesRole && matchesCity && matchesName;
  });

  const uniqueCities = Array.from(new Set(users.map((u) => u.city))).filter(Boolean).sort();
  const uniqueNames = Array.from(new Set(users.map((u) => u.userName))).filter(Boolean).sort();

  return (
    <div className="space-y-4">
      {/* Desktop Filter Grid */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full pt-2">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm font-bold text-slate-700"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={nameFilter}
            onChange={(e) => setSearchNameFilter(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm font-bold text-slate-700"
          >
            <option value="All">All Names</option>
            {uniqueNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 shadow-sm font-bold text-slate-700"
            >
              <option value="All">All Cities</option>
              {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="h-9 bg-red-600 hover:bg-red-700 text-white shadow-md text-xs whitespace-nowrap px-4">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Management Bar */}
      <div className="sm:hidden sticky top-[-1px] z-[50] -mx-4 px-4 py-3 bg-white border-b border-slate-100 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-red-500" />
            <Input
              placeholder="Search all fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-red-500/10 focus:border-red-500 rounded-xl text-sm transition-all"
            />
          </div>

          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 bg-white border-slate-200 rounded-xl shadow-sm relative">
                <Filter className="w-4 h-4 text-slate-500" />
                {(roleFilter !== "All" || cityFilter !== "All" || nameFilter !== "All") && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-10">
              <SheetHeader className="mb-6">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                <SheetTitle className="text-lg font-black text-slate-800">Filter Directory</SheetTitle>
                <SheetDescription>Select criteria to filter user records.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Account Role</Label>
                  <div className="flex gap-2">
                    {["All", "Admin", "User"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${roleFilter === role ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-slate-100 text-slate-500"
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">By City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-sm font-bold text-slate-700 appearance-none focus:border-red-500 outline-none"
                    >
                      <option value="All">All Cities</option>
                      {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-xl bg-red-600 font-black uppercase tracking-widest"
                  onClick={() => setIsFilterSheetOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="h-11 w-11 p-0 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-200 transition-transform active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
        </div>
      </div>


      {/* Shared Dialog Component */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
          <div className={`h-2 w-full ${formData.role === "Admin" ? "bg-red-600" : "bg-blue-600"}`} />

          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${formData.role === "Admin" ? "bg-red-600" : "bg-blue-600"}`}>
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-xl font-black text-slate-800">
                    {isEditing ? "Update Profile" : "Create Account"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">
                    {isEditing ? `Modifying settings for ${editingSerial}` : "Enter details to register a new user."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Role Selector */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Account Role</Label>
                <div className="relative">
                  <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${formData.role === "Admin" ? "text-red-500" : "text-blue-500"}`} />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`flex h-11 w-full rounded-xl border-2 pl-10 pr-3 py-1 text-sm shadow-sm transition-all focus:outline-none font-bold appearance-none ${formData.role === "Admin" ? "border-red-100 bg-red-50/30 text-red-700 focus:border-red-500" : "border-blue-100 bg-blue-50/30 text-blue-700 focus:border-blue-500"
                      }`}
                  >
                    <option value="User">Standard User</option>
                    <option value="Admin">Administrator</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Filter className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Full Name</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="userName" value={formData.userName} onChange={handleInputChange} placeholder="e.g. John Doe" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">+91</div>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="9999900000" maxLength={10} className="pl-12 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
              </div>

              {/* Digital Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Gmail Address</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="gmail" value={formData.gmail} onChange={handleInputChange} placeholder="name@gmail.com" type="email" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">UPI Identity</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="upiId" value={formData.upiId} onChange={handleInputChange} placeholder="username@upi" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
              </div>

              {/* Location & Dealer Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Current City</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="city" value={formData.city} onChange={handleInputChange} placeholder="City Name" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>
                {formData.role !== "Admin" && (
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Dealer Reference</Label>
                    <div className="relative">
                      <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="dealerName" value={formData.dealerName} onChange={handleInputChange} placeholder="Dealer Name" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Security Section */}
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-black tracking-widest text-slate-400 ml-1">Access Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input name="pass" value={formData.pass} onChange={handleInputChange} placeholder="Min 6 characters" type="password" className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus:ring-red-500 focus:border-red-500" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleAddUser}
                disabled={isSaving}
                className={`w-full h-12 rounded-xl text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${formData.role === "Admin" ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-red-200" : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200"
                  }`}
              >
                {isSaving ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isEditing ? <Settings className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    <span>{isEditing ? "Update User Data" : "Initialize Account"}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Table and Cards */}
      <div className="bg-transparent">
        <div className="p-0">
          <div className="hidden sm:block rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[520px] relative scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full border-separate border-spacing-0 min-w-[1100px]">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Serial NO</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">User Name</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Phone</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Role</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Gmail</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">UPI ID</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">City</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Dealer</th>
                    <th className="sticky top-0 z-50 bg-slate-50 border-b border-slate-100 px-4 py-3 text-left text-xs font-bold text-slate-600">Pass</th>
                    <th className="sticky top-0 right-0 z-[60] bg-slate-50 border-b border-l border-slate-100 px-4 py-3 text-right text-xs font-bold text-slate-600 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {isLoading ? (
                    <tr><td colSpan={10} className="h-24 text-center"><div className="flex items-center justify-center gap-2 text-slate-500 py-8"><Loader2 className="w-4 h-4 animate-spin" />Loading users...</div></td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={10} className="h-24 text-center text-slate-500 py-8">No users found matching your filters.</td></tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.serialNo} className="text-xs group hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 border-b border-slate-50 font-mono font-bold text-slate-400">{user.serialNo}</td>
                        <td className="px-4 py-3 border-b border-slate-50 font-bold text-slate-800">{user.userName}</td>
                        <td className="px-4 py-3 border-b border-slate-50 font-medium text-slate-600">{user.phone}</td>
                        <td className="px-4 py-3 border-b border-slate-50">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role.toLowerCase() === "admin" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3 border-b border-slate-50 text-slate-500">{user.gmail}</td>
                        <td className="px-4 py-3 border-b border-slate-50 text-slate-500 font-mono">{user.upi}</td>
                        <td className="px-4 py-3 border-b border-slate-50 text-slate-500">{user.city}</td>
                        <td className="px-4 py-3 border-b border-slate-50 text-slate-500">{user.dealer || "-"}</td>
                        <td className="px-4 py-3 border-b border-slate-50"><PasswordCell password={user.pass} /></td>
                        <td className="sticky right-0 z-10 bg-white border-l border-b border-slate-50 px-4 py-3 text-right shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50/80 transition-colors">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Settings className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.serialNo)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden mt-2">
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">User Records</h2>
              </div>
              <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-black border border-red-100 shadow-sm">
                {filteredUsers.length} ACTIVE
              </span>
            </div>

            <div className="space-y-1 p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Syncing Data...</span>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 mx-2">
                  <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Records Found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.serialNo} className="bg-white rounded-xl border border-slate-100 shadow-sm relative overflow-hidden transition-all active:scale-[0.98]">
                    {/* Role Accent Bar */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${user.role.toLowerCase() === "admin" ? "bg-red-500" : "bg-blue-500"}`} />

                    <div className="p-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md ${user.role.toLowerCase() === "admin" ? "bg-red-500" : "bg-blue-500"}`}>
                            {user.userName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight uppercase tracking-tight">{user.userName}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic">
                                #{user.serialNo}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${user.role.toLowerCase() === "admin" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-300 uppercase font-black tracking-widest">{user.city}</p>
                          <p className="text-[11px] text-slate-600 font-black mt-0.5">{user.phone}</p>
                        </div>
                      </div>

                      {/* Card Content Grid (Table Data) */}
                      <div className="grid grid-cols-1 gap-2 py-2.5 border-y border-slate-50">
                        {user.gmail && (
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-300 uppercase w-10">Gmail</span>
                            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                              <Search className="w-3 h-3 text-slate-300 flex-shrink-0" />
                              <p className="text-[11px] text-slate-500 font-medium truncate">{user.gmail}</p>
                            </div>
                          </div>
                        )}
                        {user.upi && (
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-300 uppercase w-10">UPI ID</span>
                            <div className="flex-1 flex items-center gap-1.5 min-w-0">
                              <Key className="w-3 h-3 text-slate-300 flex-shrink-0" />
                              <p className="text-[11px] text-slate-500 font-mono font-bold truncate">{user.upi}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5">
                          <Button variant="secondary" size="sm" onClick={() => handleEditClick(user)} className="h-8 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border-none flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
                            <Settings className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase">Edit</span>
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDeleteUser(user.serialNo)} className="h-8 w-8 p-0 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-sm active:scale-95 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] text-slate-300 uppercase font-black tracking-widest block mb-0.5">Dealer Ref</span>
                          <span className="text-[10px] text-slate-500 font-bold truncate max-w-[100px] block italic bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {user.dealer || "Not Assigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordCell({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px]">{show ? password : "••••••"}</span>
      <Button variant="ghost" size="icon" onClick={() => setShow(!show)} className="h-6 w-6 text-slate-400 hover:text-slate-600"><Key className="w-3 h-3" /></Button>
    </div>
  );
}
