"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Settings,
  UserPlus,
  Users,
  Shield,
  Key,
} from "lucide-react";

interface User {
  serialNo: string;
  userName: string;
  id: string;
  pass: string; // Displaying password as requested (usually discouraged, but following requirements)
  role: string;
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
    id: "",
    pass: "",
    role: "User",
  });

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
        // Map sheet data to User interface
        // A: Serial, B: Name, C: ID, D: Pass, E: Role
        const parsedUsers = result.data
          .slice(1)
          .map((row: string[], index: number) => ({
            serialNo: row[0] || "",
            userName: row[1] || "",
            id: row[2] || "",
            pass: row[3] || "",
            role: row[4] || "", // Assuming Role is Col E
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
      // Generate Serial NO (SN-001 format)
      // Find max existing number
      let maxNum = 0;
      users.forEach((user) => {
        const match = user.serialNo.match(/SN-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      const serialNo = `SN-${String(nextNum).padStart(3, "0")}`;

      const submitParams = new URLSearchParams({
        sheetName: "Login",
        action: "insert", // Using insert action
        // Assuming the backend script handles row appending.
        // We'll pass rowData as JSON.
        rowData: JSON.stringify([
          serialNo,
          formData.userName,
          formData.id,
          formData.pass,
          formData.role, // Using Col E for Role
        ]),
      });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: submitParams.toString(),
      });

      const result = await response.json();
      if (result.success) {
        setFormData({ userName: "", id: "", pass: "", role: "User" });
        setIsDialogOpen(false);
        fetchUsers(); // Refresh list associated with new user
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500 text-sm">Manage users and permissions</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for the system.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User Name</Label>
                <Input
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label>ID (Login)</Label>
                <Input
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="Username/ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  name="pass"
                  value={formData.pass}
                  onChange={handleInputChange}
                  placeholder="Password"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Role (e.g. Admin)"
                />
              </div>

              <Button
                onClick={handleAddUser}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save User"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg">User Accounts</CardTitle>
              <CardDescription>
                List of all registered system users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Desktop Table */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Serial NO</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Pass</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.serialNo}>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {user.serialNo}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.userName}
                      </TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-mono text-xs">
                        ••••••
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {user.role}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No users found.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.serialNo}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-3xl -mr-2 -mt-2 z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-white shadow-sm">
                          {user.userName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">
                            {user.userName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {user.serialNo}
                            </span>
                            <span className="text-[10px] text-slate-300">
                              •
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                user.role.toLowerCase() === "admin"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          <Users className="w-3 h-3" />
                          Login ID
                        </div>
                        <p className="font-medium text-slate-700 text-sm pl-4.5">
                          {user.id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          <Key className="w-3 h-3" />
                          Password
                        </div>
                        <p className="font-mono text-sm text-slate-500 pl-4.5">
                          ••••••
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
