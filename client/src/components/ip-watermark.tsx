import React from 'react';

export function IPWatermark() {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-900/80 text-white px-3 py-2 rounded-lg text-xs font-mono border border-red-500">
      <div className="flex flex-col text-right">
        <span className="font-bold">OriginLedger™</span>
        <span>© 2025 Patent Pending</span>
        <span className="text-red-300">CONFIDENTIAL</span>
      </div>
    </div>
  );
}

export function HeaderCopyright() {
  return (
    <div className="bg-red-900 text-white text-center py-2 text-xs">
      <strong>PROPRIETARY & CONFIDENTIAL:</strong> This system contains patent-pending technologies of OriginLedger Technologies, LLC. 
      Unauthorized use is prohibited. Detroit stakeholder evaluation only.
    </div>
  );
}