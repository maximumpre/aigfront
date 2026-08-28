"use server";

import { redirect } from "next/navigation";

type LoginResult = {
  success: boolean;
  error?: string;
};

export async function loginUser(
  userId: string,
  password: string,
): Promise<LoginResult> {
  if (!userId || !password) {
    return {
      success: false,
      error: "User ID and password are required.",
    };
  }

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  if (!response.ok) {
    throw new Error("Failed to send login data");
  }

  const authenticated = true; // Replace with real authentication.

  if (!authenticated) {
    return {
      success: false,
      error: "Invalid User ID or password.",
    };
  }

  // Create a secure session here.
  // Do not return or expose the password.

  return {
    success: true,
  };
}
