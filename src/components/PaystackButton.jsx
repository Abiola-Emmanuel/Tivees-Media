"use client";

import { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getStoredCustomer = () => {
  if (typeof window === "undefined") {
    return { email: "", userId: "", subscriptionStatus: "" };
  }

  const storedUser = window.localStorage.getItem("user");

  if (!storedUser) {
    return { email: "", userId: "", subscriptionStatus: "" };
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    return {
      email: parsedUser?.email || "",
      userId: parsedUser?.userId || parsedUser?.id || parsedUser?._id || "",
      subscriptionStatus: parsedUser?.subscriptionStatus || "",
    };
  } catch (error) {
    console.error("Unable to parse stored user for payment:", error);
    return { email: "", userId: "", subscriptionStatus: "" };
  }
};

const PaystackButton = ({ amount = 0, planName = "plan", onStatusChange }) => {
  const [customer, setCustomer] = useState(getStoredCustomer);
  const [isPaymentUpdating, setIsPaymentUpdating] = useState(false);
  const hasActiveSubscription = customer.subscriptionStatus?.toLowerCase() === "active";

  const config = {
    reference: new Date().getTime().toString(),
    email: customer.email || "user@email.com",
    amount: Math.round(Number(amount || 0) * 100),
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    metadata: {
      userId: customer.userId,
      amount,
      planName,
    },
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      type="button"
      disabled={hasActiveSubscription || isPaymentUpdating}
      onClick={() => {
        if (hasActiveSubscription) {
          onStatusChange("Your subscription is already active.");
          return;
        }

        if (!config.publicKey) {
          onStatusChange("Paystack public key is missing in your environment variables.");
          return;
        }

        if (!config.amount) {
          onStatusChange("This payment plan does not have a valid price.");
          return;
        }

        initializePayment({
          onSuccess: async (response) => {
            console.log("Paystack payment response:", response);

            const transactionId = response?.transaction || response?.trans;

            if (!transactionId) {
              onStatusChange("Payment succeeded, but no transaction ID was returned.");
              return;
            }

            try {
              setIsPaymentUpdating(true);
              const authToken = window.localStorage.getItem("authToken");
              const statusResponse = await axios.post(
                `${API_BASE_URL}/api/v1/users/payment-status`,
                {
                  email: config.email,
                  transactionId,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                  },
                }
              );

              console.log("Payment status response:", statusResponse);

              const currentUserResponse = await axios.get(
                `${API_BASE_URL}/api/v1/users/current-user`,
                {
                  headers: {
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                  },
                }
              );
              const updatedUser = currentUserResponse.data?.user;

              if (updatedUser) {
                window.localStorage.setItem("user", JSON.stringify(updatedUser));
                setCustomer({
                  email: updatedUser.email || "",
                  userId: updatedUser.userId || updatedUser.id || updatedUser._id || "",
                  subscriptionStatus: updatedUser.subscriptionStatus || "",
                });
              }

              onStatusChange(`Payment successful for ${planName}`);
            } catch (error) {
              console.log("Payment status error response:", {
                status: error?.response?.status,
                data: error?.response?.data,
              });
              console.error("Unable to update payment status:", error);
              onStatusChange(
                error?.response?.data?.message ||
                error?.message ||
                "Payment succeeded, but status update failed."
              );
            } finally {
              setIsPaymentUpdating(false);
            }
          },
          onClose: () => {
            console.log("Payment closed");
            onStatusChange("Payment closed");
          },
        });
      }}
      className="flex-1 bg-red-600 hover:bg-red-700 py-2 sm:py-2.5 md:py-3 rounded-lg transition cursor-pointer text-sm sm:text-base disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-300"
    >
      {hasActiveSubscription
        ? "Subscription active"
        : isPaymentUpdating
          ? "Updating subscription..."
          : `Pay for ${planName}`}
    </button>
  );
};

export default PaystackButton;
