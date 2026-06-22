"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus, Briefcase, Clock, DollarSign, Zap } from "lucide-react";
import { getJobs, getCategories } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Job, Category, Meta } from "@/types";

const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "bg-gray-100 text-gray-500" },
  normal: { label: "Normal", color: "bg-blue-50 text-blue-600" },
  urgent: { label: "Urgent", color: "bg-red-50 text-red-600" },
};

function JobCard({ job }: { job: Job }) {
  const urg = URGENCY_LABEL[job.urgency] ?? URGENCY_LABEL.normal;
  const daysLeft = job.expiresAt
    ? Math.max(0, Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{job.title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {job.postedBy.firstName} {job.postedBy.lastName} · {job.category.name}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", urg.color)}>
          {urg.label}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-gray-600">{job.description}</p>

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        {job.budget != null && (
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {job.budget.toLocaleString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase size={12} />
          {job._count?.applications ?? 0} applicant{(job._count?.applications ?? 0) !== 1 ? "s" : ""}
        </span>
        {daysLeft !== null && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function JobsPage() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [urgency, setUrgency] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobs({ search: search || undefined, categoryId: categoryId || undefined, urgency: urgency || undefined, page, limit: 12 });
      setJobs(res.data);
      setMeta(res.meta ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, urgency, page]);

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId, urgency]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="mt-0.5 text-sm text-gray-500">Find skilled-work opportunities near you</p>
        </div>
        {user && (
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Post a Job
          </Link>
        )}
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            showFilters ? "border-blue-500 bg-blue-50 text-blue-600" : "bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-xl border bg-gray-50 p-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any urgency</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="normal">🔵 Normal</option>
            <option value="low">⚪ Low</option>
          </select>
          {(categoryId || urgency) && (
            <button
              onClick={() => { setCategoryId(""); setUrgency(""); }}
              className="rounded-lg border bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Job grid */}
      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Briefcase size={40} className="mb-4 text-gray-300" />
          <p className="font-medium text-gray-500">No jobs found</p>
          <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters</p>
          {user && (
            <Link href="/jobs/new" className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              <Plus size={15} /> Post the first job
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {meta.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            disabled={page === meta.pages}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
