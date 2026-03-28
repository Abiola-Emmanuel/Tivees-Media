"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  X,
  ArrowUpDown,
  Loader2,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthToken } from "@/store/hooks";
import MetricCard from "../../../component/admin/MetricCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";

interface ApiWatchParty {
  _id: string;
  movieTitle: string;
  movieLink: string;
  host: string;
  status: string;
  participants: string[];
  numberOfPeopleWatching: number;
}

interface GetWatchPartyResponse {
  status: string;
  count: number;
  data: ApiWatchParty[];
}

async function fetchWatchParties(
  token: string | null,
): Promise<ApiWatchParty[]> {
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-watchParty`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch watch parties");
  const json = (await res.json()) as GetWatchPartyResponse;
  if (json.status !== "SUCCESS" || !Array.isArray(json.data)) return [];
  return json.data;
}

const getStatusBadgeColor = (status: string) => {
  const s = (status ?? "").toUpperCase();
  if (s === "SCHEDULED")
    return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (s === "ONGOING" || s === "ACTIVE")
    return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s === "ENDED" || s === "COMPLETED")
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  if (s === "DRAFT") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

const formatStatus = (status: string) => {
  const s = (status ?? "").toUpperCase();
  if (s === "SCHEDULED") return "Scheduled";
  if (s === "ONGOING" || s === "ACTIVE") return "Active";
  if (s === "ENDED" || s === "COMPLETED") return "Ended";
  if (s === "DRAFT") return "Draft";
  return status || "—";
};

export default function WatchPartyPage() {
  const token = useAuthToken();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: parties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-watchparties", token],
    queryFn: () => fetchWatchParties(token),
    enabled: !!token,
  });

  const filteredParties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.movieTitle?.toLowerCase().includes(q) ||
        (p.status ?? "").toLowerCase().includes(q) ||
        p.host?.toLowerCase().includes(q),
    );
  }, [parties, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredParties.length / rowsPerPage),
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredParties.slice(startIndex, endIndex);

  const activeCount = parties.filter((p) =>
    ["SCHEDULED", "ONGOING", "ACTIVE"].includes((p.status ?? "").toUpperCase()),
  ).length;
  const totalParticipants = parties.reduce(
    (sum, p) => sum + (p.numberOfPeopleWatching ?? p.participants?.length ?? 0),
    0,
  );
  const avgParticipants =
    parties.length > 0 ? (totalParticipants / parties.length).toFixed(1) : "0";

  const handleExport = () => {
    const csvContent = [
      ["Title", "Host", "Participants", "Status"],
      ...filteredParties.map((p) => [
        p.movieTitle ?? "",
        p.host ?? "",
        String(p.numberOfPeopleWatching ?? p.participants?.length ?? 0),
        formatStatus(p.status),
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
    a.download = "watchparty-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const handleEdit = (_id: string) => {
    toast.info("Edit watch party is not available.");
  };

  const handleDelete = (party: ApiWatchParty) => {
    toast.info("Delete watch party is not available.");
  };

  const handleMoreOptions = (_id: string) => {
    toast.info("More options coming soon.");
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
      <div className="max-w-full">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Watchparty
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Real-time monitoring of active watch parties
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
          <MetricCard
            label="Active Parties"
            value={String(activeCount)}
            change="—"
            changePositive={true}
          />
          <MetricCard
            label="Total Participants"
            value={String(totalParticipants)}
            change="—"
            changePositive={true}
          />
          <MetricCard
            label="Avg Participant"
            value={avgParticipants}
            change="—"
            changePositive={true}
          />
        </div>

        {/* Watchparty List/Table Section */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          {/* Action Bar */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <button
              onClick={() => toast.info("Filter coming soon.")}
              className="flex items-center justify-center gap-2 bg-[#0f0f0f] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Filter</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-[#0f0f0f] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <Download size={18} />
              <span className="text-sm font-medium">Export Data</span>
            </button>

            <button
              onClick={() => toast.info("Add watch party coming soon.")}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">New Watch Party</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="px-4 sm:px-6 py-12 text-center text-gray-400">
              Failed to load watch parties. Please try again.
            </div>
          ) : (
            <>
              {/* Table - Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        TITLE
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        HOST
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        PARTICIPANTS
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        DURATION
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          STATUS
                          <ArrowUpDown size={14} className="text-gray-500" />
                        </div>
                      </th>
                      <th className="text-right px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 sm:px-6 py-12 text-center text-gray-400"
                        >
                          No watch parties found.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((party) => (
                        <tr
                          key={party._id}
                          className="border-b border-gray-800 hover:bg-[#242424] transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                                <Film
                                  size={24}
                                  className="text-gray-600"
                                  aria-hidden
                                />
                              </div>
                              <span className="text-white font-medium text-sm">
                                {party.movieTitle || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">
                                {party.host
                                  ? `Host ${party.host.slice(-6)}`
                                  : "—"}
                              </p>
                              <p className="text-gray-400 text-xs truncate">
                                ID: {party.host || "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {party.numberOfPeopleWatching ??
                              party.participants?.length ??
                              0}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            —
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(party.status)}`}
                            >
                              {formatStatus(party.status)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(party._id)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Edit"
                              >
                                <Pencil size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(party)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleMoreOptions(party._id)}
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

              {/* Mobile View - Card Layout */}
              <div className="md:hidden">
                {paginatedData.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No watch parties found.
                  </div>
                ) : (
                  paginatedData.map((party) => (
                    <div
                      key={party._id}
                      className="p-4 border-b border-gray-800"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                          <Film
                            size={32}
                            className="text-gray-600"
                            aria-hidden
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-base mb-2">
                            {party.movieTitle || "—"}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">
                            Host:{" "}
                            {party.host ? `…${party.host.slice(-8)}` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">
                            Participants
                          </p>
                          <p className="text-gray-300">
                            {party.numberOfPeopleWatching ??
                              party.participants?.length ??
                              0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Duration</p>
                          <p className="text-gray-300">—</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(party.status)}`}
                          >
                            {formatStatus(party.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                        <button
                          onClick={() => handleEdit(party._id)}
                          className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                          <Pencil size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(party)}
                          className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleMoreOptions(party._id)}
                          className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 text-white rounded text-sm hover:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt; Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                    )
                    .map((p, i, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-2 text-gray-400">…</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 rounded text-sm transition-colors ${
                            currentPage === p
                              ? "bg-blue-600 text-white"
                              : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 text-white rounded text-sm hover:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next &gt;
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm">Go to Page:</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(
                      1,
                      Math.min(totalPages, Number(e.target.value) || 1),
                    );
                    setCurrentPage(page);
                  }}
                  className="w-16 bg-[#1a1a1a] border border-gray-800 text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-700"
                />
              </div>
            </div>

            <div className="mt-4 text-center sm:text-left">
              <p className="text-gray-400 text-sm">
                Showing {filteredParties.length === 0 ? 0 : startIndex + 1}-
                {Math.min(endIndex, filteredParties.length)} of{" "}
                {filteredParties.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
