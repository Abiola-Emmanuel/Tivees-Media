"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthToken } from "@/store/hooks";
import MetricCard from "../../../component/admin/MetricCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface PaymentPlan {
  _id: string;
  name: string;
  price: number;
  durationInDays: number;
  features: string[];
  status?: string;
  createdAt?: string;
}

interface GetPaymentPlanResponse {
  status: string;
  data: PaymentPlan[];
}

async function fetchPaymentPlans(token: string | null): Promise<PaymentPlan[]> {
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-getPaymentPlan`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch payment plans");
  const json = (await res.json()) as GetPaymentPlanResponse;
  if (json.status !== "SUCCESS" || !Array.isArray(json.data)) return [];
  return json.data;
}

async function updatePaymentPlan(
  token: string | null,
  planId: string,
  payload: { name?: string },
): Promise<PaymentPlan> {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-updatePaymentPlan`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ planId, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to update payment plan",
    );
  }
  const json = await res.json();
  return json.data;
}

export default function SubscriptionPage() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [editName, setEditName] = useState("");
  const [deletePlan, setDeletePlan] = useState<PaymentPlan | null>(null);

  const {
    data: plans = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-payment-plans", token],
    queryFn: () => fetchPaymentPlans(token),
    enabled: !!token,
  });

  const plan = plans[0] ?? null;

  const updateMutation = useMutation({
    mutationFn: ({ planId, name }: { planId: string; name: string }) =>
      updatePaymentPlan(token, planId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-plans"] });
      setEditingPlan(null);
      toast.success("Payment plan updated successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update plan.");
    },
  });

  const handleEdit = (p: PaymentPlan) => {
    setEditingPlan(p);
    setEditName(p.name);
  };

  const handleSaveEdit = () => {
    if (!editingPlan || !editName.trim()) return;
    updateMutation.mutate({ planId: editingPlan._id, name: editName.trim() });
  };

  const handleDeleteClick = (p: PaymentPlan) => {
    setDeletePlan(p);
  };

  const handleDeleteConfirm = () => {
    toast.info("Delete payment plan is not available.");
    setDeletePlan(null);
  };

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  return (
    <>
      <AlertDialog
        open={!!deletePlan}
        onOpenChange={(open) => !open && setDeletePlan(null)}
      >
        <AlertDialogContent className="border-gray-800 bg-[#1a1a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Delete payment plan is not available. There is no API endpoint to
              delete plans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      >
        <DialogContent className="border-gray-800 bg-[#1a1a1a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit payment plan</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the plan name. Features are fixed for this plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-300">
                Plan name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-gray-700 bg-[#2a2a2a] text-white placeholder:text-gray-500"
                placeholder="e.g. Premium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPlan(null)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim() || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
        <div className="max-w-full">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Subscriptions
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Manage subscription plans and revenue
            </p>
          </div>

          {/* Metric Cards - placeholder until API provides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
            <MetricCard
              label="Total MRR"
              value="—"
              change="—"
              changePositive={true}
            />
            <MetricCard
              label="Active Subscribers"
              value="—"
              change="—"
              changePositive={true}
            />
            <MetricCard
              label="Avg Revenue per user"
              value="—"
              change="—"
              changePositive={true}
            />
          </div>

          {/* Payment Plan Card(s) - single plan from API */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-gray-800 bg-[#1a1a1a] p-8 text-center text-gray-400">
              Failed to load payment plans. Please try again.
            </div>
          ) : !plan ? (
            <div className="rounded-lg border border-gray-800 bg-[#1a1a1a] p-8 text-center text-gray-400">
              No payment plan found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-2xl">
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 sm:p-5 md:p-6 flex flex-col">
                {/* Plan Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2 capitalize">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /
                      {plan.durationInDays === 30
                        ? "month"
                        : `${plan.durationInDays} days`}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Subscribers: —</p>
                </div>

                {/* Features - from API; all shown as included */}
                <div className="flex-1 mb-6 space-y-3">
                  {plan.features?.length ? (
                    plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check
                          className="text-green-500 flex-shrink-0 mt-0.5"
                          size={20}
                        />
                        <span className="text-sm text-gray-300">{f}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No features listed</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(plan)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
