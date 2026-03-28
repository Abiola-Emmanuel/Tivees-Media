"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthToken } from "@/store/hooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  picture: string | null;
  status?: string;
  createdAt: string;
}

interface GetUsersResponse {
  status: string;
  data: ApiUser[];
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getStatusBadgeColor = (status: string) => {
  const s = (status ?? "active").toLowerCase();
  if (s === "suspended") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "active")
    return "bg-green-500/20 text-green-400 border-green-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

async function fetchUsers(token: string | null): Promise<ApiUser[]> {
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-getUsers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = (await res.json()) as GetUsersResponse;
  if (json.status !== "SUCCESS" || !Array.isArray(json.data)) return [];
  return json.data;
}

async function updateUserStatus(
  token: string | null,
  userId: string,
  status: "SUSPENDED" | "active",
): Promise<void> {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-updateUsersStatus`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to update user status",
    );
  }
}

export default function UsersPage() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userToSuspend, setUserToSuspend] = useState<ApiUser | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-users", token],
    queryFn: () => fetchUsers(token),
    enabled: !!token,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      updateUserStatus(token, userId, "SUSPENDED"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User has been suspended.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to suspend user.");
    },
  });

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.status ?? "").toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleFilter = () => {
    // TODO: Implement filter UI when design is provided
  };

  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Status", "Date Joined"],
      ...filteredUsers.map((u) => [
        u.name,
        u.email,
        u.status ?? "active",
        format(new Date(u.createdAt), "yyyy-MM-dd HH:mm:ss"),
      ]),
    ]
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const handleAddUser = () => {
    // TODO: Implement add user form when UI design is provided
  };

  const handleEdit = (_userId: string) => {
    // TODO: Implement edit user when UI design is provided
  };

  const handleSuspendClick = (user: ApiUser) => {
    if ((user.status ?? "active").toLowerCase() === "suspended") {
      toast.info("User is already suspended.");
      return;
    }
    setUserToSuspend(user);
  };

  const handleSuspendConfirm = () => {
    if (userToSuspend) {
      suspendMutation.mutate({ userId: userToSuspend._id });
      setUserToSuspend(null);
    }
  };

  const handleMoreOptions = (_userId: string) => {
    // TODO: Implement more options menu when UI design is provided
  };

  return (
    <>
      <AlertDialog
        open={!!userToSuspend}
        onOpenChange={(open) => !open && setUserToSuspend(null)}
      >
        <AlertDialogContent className="border-gray-800 bg-[#1a1a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend user</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to suspend &quot;{userToSuspend?.name}
              &quot;? The user will no longer be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleSuspendConfirm}
              disabled={suspendMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {suspendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Suspending…
                </>
              ) : (
                "Suspend"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
        <div className="max-w-full">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Users
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Manage and monitor user accounts
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={handleFilter}
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#242424] transition-colors"
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Filter</span>
            </button>

            {/* Export Data Button */}
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#242424] transition-colors"
            >
              <Download size={18} />
              <span className="text-sm font-medium">Export Data</span>
            </button>

            {/* Add User Button */}
            <button
              onClick={handleAddUser}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold text-sm sm:text-base">
                USERS
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-gray-500" />
              </div>
            ) : isError ? (
              <div className="px-4 sm:px-6 py-12 text-center text-gray-400">
                Failed to load users. Please try again.
              </div>
            ) : (
              <>
                {/* Table - Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                          User
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                          Watch Hours
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                          Status
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                          Date Joined
                        </th>
                        <th className="text-right px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 sm:px-6 py-12 text-center text-gray-400"
                          >
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => (
                          <tr
                            key={user._id}
                            className="border-b border-gray-800 hover:bg-[#242424] transition-colors"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                {user.picture ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                                    <Image
                                      src={user.picture}
                                      alt={user.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`${getAvatarColor(user._id)} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                                  >
                                    {getInitials(user.name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-sm truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-gray-400 text-xs truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                              —
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(user.status ?? "active")}`}
                              >
                                {(user.status ?? "active")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (user.status ?? "active")
                                    .slice(1)
                                    .toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                              {format(
                                new Date(user.createdAt),
                                "yyyy-MM-dd HH:mm:ss",
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(user._id)}
                                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                                  aria-label="Edit"
                                >
                                  <Pencil size={16} className="text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleSuspendClick(user)}
                                  disabled={suspendMutation.isPending}
                                  className="p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                                  aria-label="Suspend user"
                                >
                                  <Trash2 size={16} className="text-gray-400" />
                                </button>
                                <button
                                  onClick={() => handleMoreOptions(user._id)}
                                  className="p-2 hover:bg-gray-800 rounded transition-colors"
                                  aria-label="More options"
                                >
                                  <MoreVertical
                                    size={16}
                                    className="text-gray-400"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="p-4 border-b border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {user.picture ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                              <Image
                                src={user.picture}
                                alt={user.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div
                              className={`${getAvatarColor(user._id)} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                            >
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">
                              {user.name}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(user._id)}
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                          >
                            <Pencil size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleSuspendClick(user)}
                            disabled={suspendMutation.isPending}
                            className="p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleMoreOptions(user._id)}
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">
                            Watch Hours
                          </p>
                          <p className="text-gray-300">—</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(user.status ?? "active")}`}
                          >
                            {(user.status ?? "active").charAt(0).toUpperCase() +
                              (user.status ?? "active").slice(1).toLowerCase()}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 text-xs mb-1">
                            Date Joined
                          </p>
                          <p className="text-gray-300 text-xs">
                            {format(
                              new Date(user.createdAt),
                              "yyyy-MM-dd HH:mm:ss",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6">
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              {/* Rows per Page */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm">Rows per Page:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#1a1a1a] border border-gray-800 text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:border-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Navigation */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 text-white rounded text-sm hover:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &lt; Prev
                </button>
                {(() => {
                  const pages: number[] = [];
                  const add = (p: number) => {
                    if (p >= 1 && p <= totalPages && !pages.includes(p))
                      pages.push(p);
                  };
                  add(1);
                  if (currentPage > 3) pages.push(-1);
                  for (let p = currentPage - 1; p <= currentPage + 1; p++)
                    add(p);
                  if (currentPage < totalPages - 2) pages.push(-2);
                  add(totalPages);
                  return pages.map((p, i) =>
                    p < 0 ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${
                          currentPage === p
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  );
                })()}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 text-white rounded text-sm hover:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next &gt;
                </button>
              </div>

              {/* Go to Page */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm">Go to Page:</label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(
                      1,
                      Math.min(totalPages, Number(e.target.value)),
                    );
                    setCurrentPage(page);
                  }}
                  className="w-16 bg-[#1a1a1a] border border-gray-800 text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-700"
                />
                <button
                  onClick={() => {}}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Go
                </button>
              </div>
            </div>

            {/* Showing Results */}
            <p className="text-gray-400 text-sm text-center sm:text-left">
              Showing {filteredUsers.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredUsers.length)} of{" "}
              {filteredUsers.length}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
