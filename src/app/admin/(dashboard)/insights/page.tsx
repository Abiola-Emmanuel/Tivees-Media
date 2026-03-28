"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Film,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthToken } from "@/store/hooks";
import MetricCard from "../../../component/admin/MetricCard";
import ViewsWatchTimeChart from "../../../component/admin/ViewsWatchTimeChart";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";

interface TopContentItem {
  _id: string;
  uid?: string;
  title: string;
  description?: string;
  releaseDate?: string;
  genre?: string;
  duration: number;
  status?: string;
  createdAt?: string;
  currentlyWatching?: string[];
  watchedBy?: string[];
  views: number;
}

interface GetTopContentResponse {
  status: string;
  message?: string;
  data: TopContentItem[];
}

async function fetchTopContent(
  token: string | null,
): Promise<TopContentItem[]> {
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-getTopContent`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch top content");
  const json = (await res.json()) as GetTopContentResponse;
  if (json.status !== "SUCCESS" || !Array.isArray(json.data)) return [];
  return json.data;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return String(views);
}

export default function InsightsPage() {
  const token = useAuthToken();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: content = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-top-content", token],
    queryFn: () => fetchTopContent(token),
    enabled: !!token,
  });

  const totalPages = Math.max(1, Math.ceil(content.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = content.slice(startIndex, endIndex);

  const totalViews = content.reduce((sum, c) => sum + (c.views ?? 0), 0);

  const handleExport = () => {
    const csvContent = [
      ["Title", "Type", "Views", "Duration", "Genre"],
      ...content.map((c) => [
        c.title ?? "",
        "Movie",
        String(c.views ?? 0),
        formatDuration(c.duration ?? 0),
        c.genre ?? "",
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "top-performing-content-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const handleEdit = (_id: string) => {
    toast.info("Edit content coming soon.");
  };

  const handleDelete = (item: TopContentItem) => {
    toast.info("Delete content coming soon.");
  };

  const handleMoreOptions = (_id: string) => {
    toast.info("More options coming soon.");
  };

  const engagementPercent = (item: TopContentItem) => {
    const watched = item.watchedBy?.length ?? 0;
    const views = item.views ?? 0;
    if (views === 0) return 0;
    return Math.min(100, Math.round((watched / views) * 100));
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
      <div className="max-w-full">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Insights
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Platform performance and engagement metrics
          </p>
        </div>

        {/* Metric Cards - placeholder for Avg Watch Time, Engagement; total views from data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
          <MetricCard
            label="Total Views"
            value={formatViews(totalViews)}
            change="—"
            changePositive={true}
          />
          <MetricCard
            label="Avg Watch Time"
            value="—"
            change="—"
            changePositive={true}
          />
          <MetricCard
            label="User Engagement"
            value="—"
            change="—"
            changePositive={true}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
          <ViewsWatchTimeChart />
        </div>

        {/* Top Performing Content Table */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-white font-semibold text-sm sm:text-base">
              Top performing Content
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 bg-[#0f0f0f] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <Download size={18} />
                <span className="text-sm font-medium">Export Data</span>
              </button>
              <button
                onClick={() => toast.info("Add content from Content page.")}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">New Content</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="px-4 sm:px-6 py-12 text-center text-gray-400">
              Failed to load top content. Please try again.
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
                        TYPE
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        VIEWS
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        DURATION
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        ENGAGEMENT
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
                          No top content found.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-gray-800 hover:bg-[#242424] transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                                <Film
                                  size={28}
                                  className="text-gray-600"
                                  aria-hidden
                                />
                              </div>
                              <span className="text-white font-medium text-sm">
                                {item.title || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            Movie
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {formatViews(item.views ?? 0)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {formatDuration(item.duration ?? 0)}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{
                                    width: `${engagementPercent(item)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-gray-300 text-sm whitespace-nowrap">
                                {engagementPercent(item)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(item._id)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Edit"
                              >
                                <Pencil size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleMoreOptions(item._id)}
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
                    No top content found.
                  </div>
                ) : (
                  paginatedData.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 border-b border-gray-800"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                          <Film
                            size={40}
                            className="text-gray-600"
                            aria-hidden
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-base mb-2">
                            {item.title || "—"}
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Type</p>
                              <p className="text-gray-300">Movie</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                Views
                              </p>
                              <p className="text-gray-300">
                                {formatViews(item.views ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                Duration
                              </p>
                              <p className="text-gray-300">
                                {formatDuration(item.duration ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                Engagement
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-700 rounded-full h-2 max-w-[80px]">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${engagementPercent(item)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-gray-300 text-sm whitespace-nowrap">
                                  {engagementPercent(item)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                        <button
                          onClick={() => handleEdit(item._id)}
                          className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                          <Pencil size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 hover:bg-gray-800 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleMoreOptions(item._id)}
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
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages))
                  }
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                >
                  Go &gt;
                </button>
              </div>
            </div>

            <div className="mt-4 text-center sm:text-left">
              <p className="text-gray-400 text-sm">
                Showing {content.length === 0 ? 0 : startIndex + 1}-
                {Math.min(endIndex, content.length)} of {content.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
