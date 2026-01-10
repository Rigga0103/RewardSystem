import { Suspense } from "react";
import QRCodeForm from "@/components/qr-code-form";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
          <svg
            className="w-6 h-6 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <p className="text-slate-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <QRCodeForm />
    </Suspense>
  );
}


