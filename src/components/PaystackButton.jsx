"use client";

import { useEffect, useState } from "react";
import { usePaystackPayment } from "react-paystack";

const getStoredCustomerEmail = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const storedUser = window.localStorage.getItem("user");

  if (!storedUser) {
    return "";
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.email || "";
  } catch (error) {
    console.error("Unable to parse stored user for payment:", error);
    return "";
  }
};

const PaystackButton = ({ onStatusChange }) => {
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    setCustomerEmail(getStoredCustomerEmail());
  }, []);

  const config = {
    reference: new Date().getTime().toString(),
    email: customerEmail || "user@email.com",
    amount: 5000 * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      type="button"
      onClick={() => {
        if (!config.publicKey) {
          onStatusChange("Paystack public key is missing in your environment variables.");
          return;
        }

        initializePayment(
          () => {
            console.log("Payment success");
            onStatusChange("Payment success");
          },
          () => {
            console.log("Payment closed");
            onStatusChange("Payment closed");
          }
        );
      }}
      className="flex-1 bg-red-600 hover:bg-red-700 py-2 sm:py-2.5 md:py-3 rounded-lg transition cursor-pointer text-sm sm:text-base"
    >
      Pay Now
    </button>
  );
};

export default PaystackButton;
