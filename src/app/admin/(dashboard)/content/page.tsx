"use client";

import { useState, useRef, ChangeEvent, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Pencil,
  Trash2,
  MoreVertical,
  X,
  Plus,
  List,
  Loader2,
  CloudUpload,
  Film,
} from "lucide-react";
import QuillEditor from "./QuillEditor";
import Image from "next/image";
import { toast } from "sonner";
import { useAuthToken } from "@/store/hooks";
import { uploadVideoToCloudflareStream } from "@/lib/cloudflare-stream-upload";
import { Progress } from "@/components/ui/progress";
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

interface ApiMovie {
  _id: string;
  uid?: string;
  title: string;
  description?: string;
  releaseDate?: string;
  genre?: string;
  duration: number;
  posterUrl?: string;
  tags?: string;
  rating?: string | number;
  year?: string;
  status?: string;
  createdAt?: string;
  currentlyWatching?: string[];
  watchedBy?: string[];
  views?: number;
}

interface AdminHomePreview {
  users: { total: number; latest?: unknown[] };
  movies: { total: number; latest?: ApiMovie[] };
  watchParties: { total: number; ongoing?: unknown[] };
}

async function fetchAdminHome(token: string | null): Promise<ApiMovie[]> {
  if (!token) return [];
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-home`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (json.status !== "SUCCESS" || !json.preview?.movies?.latest) return [];
  return json.preview.movies.latest;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function mapDisplayStatus(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "inprogress") return "In progress";
  if (s === "published") return "Published";
  if (s === "draft") return "Draft";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
}

const getStatusBadgeColor = (status: string) => {
  const s = status.toLowerCase();
  if (s === "published")
    return "bg-green-500/20 text-green-400 border-green-500/30";
  if (s === "draft")
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (s === "leading" || s === "in progress")
    return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

const CATEGORY_OPTIONS = [
  "Movie",
  "Series",
  "Documentary",
  "Short Film",
  "Mini-Series",
  "TV Show",
  "Animation",
  "Anime",
  "Live Event",
  "Sports",
  "News",
  "Kids",
  "Music Video",
  "Stand‑up Comedy",
  "Reality",
  "Talk Show",
  "Podcast",
  "Educational",
  "Tutorial",
  "Web Series",
];

const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Kids",
  "Music",
  "Musical",
  "Mystery",
  "News",
  "Reality",
  "Romance",
  "Sci‑Fi",
  "Sport",
  "Superhero",
  "Talk Show",
  "Thriller",
  "War",
  "Western",
  "Noir",
  "Psychological",
  "Political",
  "Teen",
  "Faith & Spirituality",
  "African Cinema",
  "Bollywood",
  "K‑Drama",
];

export default function ContentPage() {
  // View state
  const [activeView, setActiveView] = useState<"newMovie" | "movieList">(
    "movieList",
  );

  // Form state
  const [formData, setFormData] = useState({
    movieTitle: "",
    description: "",
    category: "",
    genres: "",
    tags: "",
    year: "",
    runtime: "",
    rating: "",
  });

  // File upload state
  const [posterFile, setPosterFile] = useState<File | null>(null);
  // const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [mainMovieFile, setMainMovieFile] = useState<File | null>(null);
  // const [trailerFile, setTrailerFile] = useState<File | null>(null);

  // Cloudflare Stream upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoUID, setUploadedVideoUID] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const uploadAbortRef = useRef<{ abort: () => boolean } | null>(null);
  const token = useAuthToken();
  const queryClient = useQueryClient();

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "https://tivess-be-89v3.onrender.com";

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const posterInputRef = useRef<HTMLInputElement>(null);
  // const backdropInputRef = useRef<HTMLInputElement>(null);
  const mainMovieInputRef = useRef<HTMLInputElement>(null);
  // const trailerInputRef = useRef<HTMLInputElement>(null);

  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set(),
  );

  const [editingMovie, setEditingMovie] = useState<ApiMovie | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    genre: "",
    tags: "",
    year: "",
    minutes: "",
    rating: "",
  });
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isDeleteLoadingId, setIsDeleteLoadingId] = useState<string | null>(
    null,
  );
  const [movieToDelete, setMovieToDelete] = useState<ApiMovie | null>(null);

  const { data: movies = [], isLoading: isLoadingMovies } = useQuery({
    queryKey: ["admin-home-movies", token],
    queryFn: () => fetchAdminHome(token),
    enabled: !!token && activeView === "movieList",
  });

  // File upload handlers
  const handleFileSelect =
    (type: "poster" | "backdrop" | "mainMovie" | "trailer") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (type === "poster" && file.type.startsWith("image/")) {
          setPosterFile(file);
          // } else if (type === "backdrop" && file.type.startsWith("image/")) {
          //   setBackdropFile(file);
        } else if (type === "mainMovie" && file.type.startsWith("video/")) {
          setMainMovieFile(file);
          setUploadedVideoUID(null);
        }
        // } else if (type === "trailer" && file.type.startsWith("video/")) {
        //   setTrailerFile(file);
        // }
      }
    };

  const handleUpload = async () => {
    if (!mainMovieFile) {
      toast.warning("Please select a main movie file first.");
      return;
    }
    if (!formData.movieTitle?.trim()) {
      toast.warning("Please enter a movie title before uploading.");
      return;
    }
    if (!token) {
      toast.error("You must be signed in to upload.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const instance = await uploadVideoToCloudflareStream(
      mainMovieFile,
      formData.movieTitle,
      formData.description,
      token,
      {
        onProgress: (percent) => setUploadProgress(percent),
        onSuccess: (videoUID) => {
          uploadAbortRef.current = null;
          setIsUploading(false);
          setUploadProgress(100);
          setUploadedVideoUID(videoUID);
          toast.success(`Video uploaded. You can now save changes.`);
          setTimeout(() => setUploadProgress(0), 500);
        },
        onError: (err) => {
          uploadAbortRef.current = null;
          setIsUploading(false);
          setUploadProgress(0);
          toast.error(err.message ?? "Upload failed.");
        },
      },
    );
    uploadAbortRef.current = instance;
  };

  const handleCancelUpload = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setIsUploading(false);
    setUploadProgress(0);
    toast.info("Upload cancelled.");
  };

  // Form handlers
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openEditModal = (movie: ApiMovie) => {
    setEditingMovie(movie);
    setEditForm({
      title: movie.title ?? "",
      description: movie.description ?? "",
      genre: movie.genre ?? "",
      tags: movie.tags ?? "",
      year: movie.releaseDate ?? "",
      minutes: movie.duration ? String(movie.duration) : "",
      rating:
        movie.rating !== undefined && movie.rating !== null
          ? String(movie.rating)
          : "",
    });
  };

  const handleEditFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEdit = async () => {
    if (!editingMovie) return;
    if (!token) {
      toast.error("You must be signed in to edit.");
      return;
    }
    setIsEditSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/admin/admin-editVideo/${editingMovie._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editForm.title.trim(),
            description: editForm.description,
            genre: editForm.genre.trim(),
            tags: editForm.tags.trim(),
            year: editForm.year.trim(),
            minutes: editForm.minutes.trim(),
            rating: editForm.rating.trim(),
          }),
        },
      );

      const json = (await res.json().catch(() => null)) as
        | { status?: string; message?: string; error?: string }
        | null;

      if (!res.ok || json?.status !== "SUCCESS") {
        const msg =
          json?.message ?? json?.error ?? "Failed to update content.";
        toast.error(msg);
        return;
      }

      toast.success("Content updated successfully.");
      setEditingMovie(null);
      queryClient.invalidateQueries({ queryKey: ["admin-home-movies"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update content.",
      );
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteMovieConfirmed = async () => {
    if (!movieToDelete) return;
    if (!token) {
      toast.error("You must be signed in to delete content.");
      return;
    }

    setIsDeleteLoadingId(movieToDelete._id);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/admin/admin-deleteVideo/${movieToDelete._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = (await res.json().catch(() => null)) as
        | { status?: string; message?: string; error?: string }
        | null;

      if (!res.ok || json?.status !== "SUCCESS") {
        const msg =
          json?.message ?? json?.error ?? "Failed to delete content.";
        toast.error(msg);
        return;
      }

      toast.success("Content deleted successfully.");
      setMovieToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-home-movies"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete content.",
      );
    } finally {
      setIsDeleteLoadingId(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!uploadedVideoUID) {
      toast.warning("Upload the video first, then save changes.");
      return;
    }
    if (!posterFile) {
      toast.warning("Please select a poster image.");
      return;
    }
    if (!token) {
      toast.error("You must be signed in to save.");
      return;
    }
    setIsSaving(true);
    try {
      const posterUid = Math.floor(Math.random() * 1e12).toString();
      const posterFormData = new FormData();
      posterFormData.append("uid", posterUid);
      posterFormData.append("file", posterFile);

      const posterRes = await fetch(
        `${API_BASE}/api/v1/admin/admin-uploadPoster`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: posterFormData,
        },
      );
      const posterJson = (await posterRes.json()) as Record<string, unknown>;
      if (!posterRes.ok) {
        const msg =
          (posterJson.message as string) ??
          (posterJson.error as string) ??
          "Poster upload failed.";
        toast.error(msg);
        setIsSaving(false);
        return;
      }

      const videoRes = await fetch(
        `${API_BASE}/api/v1/admin/admin-uploadvideo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.movieTitle.trim(),
            description: (formData.description ?? "").trim(),
            uid: uploadedVideoUID,
            genre: formData.genres.trim(),
            tags: formData.tags.trim(),
            year: formData.year.trim(),
            minutes: formData.runtime.trim(),
            rating: formData.rating.trim(),
            poster: `https://assets.tivees.com/${posterUid}.webp`,
            status: "ready",
          }),
        },
      );
      const videoJson = (await videoRes.json()) as Record<string, unknown>;
      if (!videoRes.ok) {
        const msg =
          (videoJson.message as string) ??
          (videoJson.error as string) ??
          "Failed to save video details.";
        toast.error(msg);
        setIsSaving(false);
        return;
      }

      toast.success("Content saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-home-movies"] });

      setFormData({
        movieTitle: "",
        description: "",
        category: "",
        genres: "",
        tags: "",
        year: "",
        runtime: "",
        rating: "",
      });
      setPosterFile(null);
      setMainMovieFile(null);
      setUploadedVideoUID(null);
      if (posterInputRef.current) posterInputRef.current.value = "";
      if (mainMovieInputRef.current) mainMovieInputRef.current.value = "";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save changes.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Filter content based on search
  const filteredContent = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return movies;
    return movies.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.genre?.toLowerCase().includes(q) ||
        (item.status ?? "").toLowerCase().includes(q),
    );
  }, [movies, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredContent.length / rowsPerPage),
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, endIndex);

  const handleExport = () => {
    const csvContent = [
      ["Title", "Genre", "Release", "Views", "Duration", "Status"],
      ...filteredContent.map((item) => [
        item.title ?? "",
        item.genre ?? "",
        item.releaseDate ?? "",
        formatViews(item.views ?? item.watchedBy?.length ?? 0),
        formatDuration(item.duration ?? 0),
        mapDisplayStatus(item.status),
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
    a.download = "content-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
      <div className="max-w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Content
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Manage your media catalog.
            </p>
          </div>
          {activeView === "newMovie" && (
            <button
              onClick={handleSaveChanges}
              disabled={!uploadedVideoUID || isSaving}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors inline-flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "+ Save Changes"
              )}
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveView("newMovie")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeView === "newMovie"
                ? "bg-[#1a1a1a] border border-gray-800 text-red-500"
                : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
            }`}
          >
            <Plus size={18} />
            <span className="text-sm">New Movie</span>
          </button>
          <button
            onClick={() => setActiveView("movieList")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeView === "movieList"
                ? "bg-[#1a1a1a] border border-gray-800 text-white"
                : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
            }`}
          >
            <List size={18} />
            <span className="text-sm">Movie List</span>
          </button>
        </div>

        {/* Conditional Content */}
        {activeView === "newMovie" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form Fields and Media Assets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form Fields */}
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 sm:p-5 md:p-6 space-y-4">
                {/* Movie Title */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Movie Title
                  </label>
                  <input
                    type="text"
                    name="movieTitle"
                    value={formData.movieTitle}
                    onChange={handleInputChange}
                    placeholder="Enter movie title"
                    className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Description
                  </label>
                  <QuillEditor
                    value={formData.description}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, description: value }))
                    }
                    placeholder="Enter description"
                  />
                </div>

                {/* Category, Genres, Tags Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      list="category-options"
                      placeholder="Select or type category"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                    <datalist id="category-options">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Genres
                    </label>
                    <input
                      type="text"
                      name="genres"
                      value={formData.genres}
                      onChange={handleInputChange}
                      list="genre-options"
                      placeholder="Select or type genres (comma‑separated)"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                    <datalist id="genre-options">
                      {GENRE_OPTIONS.map((genre) => (
                        <option key={genre} value={genre} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Add tags (comma‑separated)"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                  </div>
                </div>

                {/* Year, Runtime, Rating Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Year
                    </label>
                    <input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      placeholder="e.g. 2024"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Runtime (minutes)
                    </label>
                    <input
                      type="text"
                      name="runtime"
                      value={formData.runtime}
                      onChange={handleInputChange}
                      placeholder="e.g. 120"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Rating
                    </label>
                    <input
                      type="text"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      placeholder="e.g. PG13, 16+"
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Media Assets Section */}
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 sm:p-5 md:p-6 space-y-4">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Media Assets
                </h3>

                {/* Poster Image */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Poster Image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect("poster")}
                      className="hidden"
                    />
                    <button
                      onClick={() => posterInputRef.current?.click()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Choose file
                    </button>
                    <input
                      type="text"
                      value={posterFile ? posterFile.name : "No file chosen"}
                      readOnly
                      className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-default"
                    />
                  </div>
                </div>

                {/* Backdrop Image – commented out for now */}
                {/* <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Backdrop Image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={backdropInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect("backdrop")}
                      className="hidden"
                    />
                    <button
                      onClick={() => backdropInputRef.current?.click()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Choose file
                    </button>
                    <input
                      type="text"
                      value={
                        backdropFile ? backdropFile.name : "No file chosen"
                      }
                      readOnly
                      className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-default"
                    />
                  </div>
                </div> */}

                {/* Main Movie File */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Main Movie File
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={mainMovieInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect("mainMovie")}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => mainMovieInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Choose file
                    </button>
                    <input
                      type="text"
                      value={
                        mainMovieFile ? mainMovieFile.name : "No file chosen"
                      }
                      readOnly
                      className="flex-1 min-w-0 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-default"
                    />
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={isUploading || !mainMovieFile}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-shrink-0"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <CloudUpload className="size-4" />
                          Upload
                        </>
                      )}
                    </button>
                    {isUploading && (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="text-gray-400 hover:text-white px-3 py-2 rounded text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {isUploading && (
                    <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Uploading to Cloudflare Stream…</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress
                        value={uploadProgress}
                        className="h-2 bg-[#0f0f0f] [&_[data-slot=progress-indicator]]:bg-red-600 transition-all duration-300"
                      />
                    </div>
                  )}
                </div>

                {/* Trailer File – commented out for now */}
                {/* <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Trailer File
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={trailerInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect("trailer")}
                      className="hidden"
                    />
                    <button
                      onClick={() => trailerInputRef.current?.click()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Choose file
                    </button>
                    <input
                      type="text"
                      value={trailerFile ? trailerFile.name : "No file chosen"}
                      readOnly
                      className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-default"
                    />
                  </div>
                </div> */}
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 sm:p-5 md:p-6 sticky top-4">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Live Preview
                </h3>

                {/* Poster Preview */}
                <div className="mb-4">
                  {posterFile ? (
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(posterFile)}
                        alt="Poster preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[2/3] bg-[#0f0f0f] border border-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Poster preview</p>
                    </div>
                  )}
                </div>

                {/* Movie Title */}
                <h4 className="text-white font-bold text-xl mb-2">
                  {formData.movieTitle || "Movie Title"}
                </h4>

                {/* Year, Rating, Runtime */}
                <p className="text-gray-400 text-sm mb-3">
                  {formData.year || "2024"} • {formData.rating || "PG13"} •{" "}
                  {formData.runtime ? `${formData.runtime}mins` : "120mins"}
                </p>

                {/* Description Preview */}
                <div className="text-gray-300 text-sm">
                  {formData.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      Your description would appear
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
              {/* Action Bar */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-gray-800 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => console.log("Filter content")}
                  className="flex items-center justify-center gap-2 bg-[#0f0f0f] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <Filter size={18} />
                  <span className="text-sm font-medium">Filter</span>
                </button>

                {/* Export Data Button */}
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 bg-[#0f0f0f] border border-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <Download size={18} />
                  <span className="text-sm font-medium">Export Data</span>
                </button>
              </div>

              {/* Table Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm sm:text-base">
                  TITLE
                </h2>
              </div>

              {/* Table - Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        TITLE
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        GENRE
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        RELEASE
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        VIEWS
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        DURATION
                      </th>
                      <th className="text-left px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        STATUS
                      </th>
                      <th className="text-right px-4 sm:px-6 py-4 text-gray-400 text-xs sm:text-sm font-medium">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingMovies ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 sm:px-6 py-12 text-center text-gray-400"
                        >
                          <Loader2 className="mx-auto size-8 animate-spin" />
                        </td>
                      </tr>
                    ) : paginatedContent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 sm:px-6 py-12 text-center text-gray-400"
                        >
                          No movies found.
                        </td>
                      </tr>
                    ) : (
                      paginatedContent.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-gray-800 hover:bg-[#242424] transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                                {item.posterUrl &&
                                !failedThumbnails.has(item.posterUrl) ? (
                                  <Image
                                    src={item.posterUrl}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    onError={() =>
                                      setFailedThumbnails((prev) =>
                                        new Set(prev).add(item.posterUrl!),
                                      )
                                    }
                                  />
                                ) : (
                                  <Film
                                    size={24}
                                    className="text-gray-600"
                                    aria-hidden
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {item.title || "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {item.genre || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {item.releaseDate || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {formatViews(
                              item.views ?? item.watchedBy?.length ?? 0,
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-300 text-sm">
                            {formatDuration(item.duration ?? 0)}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                                mapDisplayStatus(item.status),
                              )}`}
                            >
                              {mapDisplayStatus(item.status)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Edit"
                              >
                                <Pencil size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => setMovieToDelete(item)}
                                className="p-2 hover:bg-gray-800 rounded transition-colors"
                                aria-label="Delete"
                              >
                                {isDeleteLoadingId === item._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                ) : (
                                  <Trash2
                                    size={16}
                                    className="text-gray-400"
                                  />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  toast.info("More options coming soon.")
                                }
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
                {isLoadingMovies ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-gray-500" />
                  </div>
                ) : paginatedContent.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No movies found.
                  </div>
                ) : (
                  paginatedContent.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 border-b border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                            {item.posterUrl &&
                            !failedThumbnails.has(item.posterUrl) ? (
                              <Image
                                src={item.posterUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={() =>
                                  setFailedThumbnails((prev) =>
                                    new Set(prev).add(item.posterUrl!),
                                  )
                                }
                              />
                            ) : (
                              <Film
                                size={24}
                                className="text-gray-600"
                                aria-hidden
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">
                              {item.title || "—"}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {item.genre || "—"}{" "}
                              {item.releaseDate ? `· ${item.releaseDate}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                          >
                            <Pencil size={16} className="text-gray-400" />
                          </button>
                          <button
                            onClick={() => setMovieToDelete(item)}
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                          >
                            {isDeleteLoadingId === item._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                              <Trash2 size={16} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              toast.info("More options coming soon.")
                            }
                            className="p-2 hover:bg-gray-800 rounded transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Genre</p>
                          <p className="text-gray-300">{item.genre || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Release</p>
                          <p className="text-gray-300">
                            {item.releaseDate || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Views</p>
                          <p className="text-gray-300">
                            {formatViews(
                              item.views ?? item.watchedBy?.length ?? 0,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Duration</p>
                          <p className="text-gray-300">
                            {formatDuration(item.duration ?? 0)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                              mapDisplayStatus(item.status),
                            )}`}
                          >
                            {mapDisplayStatus(item.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6">
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                {/* Rows per Page */}
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 text-sm">
                    Rows per Page:
                  </label>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 text-white rounded text-sm hover:bg-[#242424] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt; Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      currentPage === 1
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                    }`}
                  >
                    1
                  </button>
                  <button
                    onClick={() => setCurrentPage(2)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      currentPage === 2
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                    }`}
                  >
                    2
                  </button>
                  <button
                    onClick={() => setCurrentPage(3)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      currentPage === 3
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                    }`}
                  >
                    3
                  </button>
                  <span className="px-2 text-gray-400">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      currentPage === totalPages
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#242424]"
                    }`}
                  >
                    {totalPages}
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
                    Go &gt;
                  </button>
                </div>
              </div>

              {/* Showing Results */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-800">
                <p className="text-gray-400 text-sm text-center sm:text-left">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredContent.length)} of{" "}
                  {filteredContent.length}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl rounded-lg border border-gray-800 bg-[#121212] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Edit Content
              </h2>
              <button
                onClick={() => setEditingMovie(null)}
                className="rounded p-1.5 hover:bg-gray-800"
                aria-label="Close edit dialog"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFieldChange}
                  placeholder="Edit title"
                  className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Description
                </label>
                <QuillEditor
                  value={editForm.description}
                  onChange={(value) =>
                    setEditForm((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Enter description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Genre
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={editForm.genre}
                    onChange={handleEditFieldChange}
                    list="genre-options"
                    placeholder="Update genres"
                    className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={editForm.tags}
                    onChange={handleEditFieldChange}
                    placeholder="Update tags"
                    className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Year
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={editForm.year}
                    onChange={handleEditFieldChange}
                    placeholder="e.g. 2024"
                    className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Minutes
                  </label>
                  <input
                    type="number"
                    name="minutes"
                    value={editForm.minutes}
                    onChange={handleEditFieldChange}
                    placeholder="e.g. 120"
                    className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Rating
                  </label>
                  <input
                    type="text"
                    name="rating"
                    value={editForm.rating}
                    onChange={handleEditFieldChange}
                    placeholder="e.g. PG13, 16+"
                    className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingMovie(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800"
                disabled={isEditSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={isEditSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isEditSaving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Save changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!movieToDelete}
        onOpenChange={(open) => {
          if (!open) setMovieToDelete(null);
        }}
      >
        <AlertDialogContent className="border-gray-800 bg-[#1a1a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete content</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete &quot;{movieToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteMovieConfirmed}
              disabled={
                !!(movieToDelete && isDeleteLoadingId === movieToDelete._id)
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {movieToDelete && isDeleteLoadingId === movieToDelete._id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
