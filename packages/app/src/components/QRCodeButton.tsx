"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import QRCodeModal from "./QRCodeModal";

interface QRCodeButtonProps {
  workerName: string;
  workerId: string;
}

export default function QRCodeButton({ workerName, workerId }: QRCodeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/workers/${workerId}`;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Share via QR code"
        title="Share via QR code"
      >
        <QrCode size={18} className="text-gray-600" />
      </button>
      <QRCodeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        workerName={workerName}
        profileUrl={profileUrl}
      />
    </>
  );
}
