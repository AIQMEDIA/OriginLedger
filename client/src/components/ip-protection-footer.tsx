import React from 'react';
import { Shield, Copyright, AlertTriangle } from 'lucide-react';

export function IPProtectionFooter() {
  return (
    <div className="bg-gray-900 text-white py-8 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Copyright Notice */}
        <div className="border-l-4 border-red-500 pl-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Copyright className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-lg">PROPRIETARY & CONFIDENTIAL</h3>
          </div>
          <p className="text-gray-300 mb-2">
            © 2025 OriginLedger Technologies, LLC. All Rights Reserved.
          </p>
          <p className="text-sm text-gray-400">
            OriginLedger™, Municipal Blockchain Platform™, and Property NFT Fractionalization™ 
            are registered trademarks of OriginLedger Technologies, LLC.
          </p>
        </div>

        {/* Patent Notice */}
        <div className="border-l-4 border-yellow-500 pl-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-yellow-400" />
            <h3 className="font-bold text-lg">PATENT PENDING TECHNOLOGIES</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Municipal Blockchain Integration</p>
              <p>Method for integrating municipal property records with blockchain technology</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Property NFT Fractionalization</p>
              <p>Novel method for converting real estate into ERC-1155 compliant NFT shares</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Civic Cryptocurrency Gateway</p>
              <p>Integration system for municipal services accepting cryptocurrency payments</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-400 mb-1">Blockchain Property Registry</p>
              <p>Immutable property ownership tracking with smart contract automation</p>
            </div>
          </div>
        </div>

        {/* Legal Warning */}
        <div className="border-l-4 border-red-600 pl-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-lg text-red-400">UNAUTHORIZED USE PROHIBITED</h3>
          </div>
          <div className="text-sm text-gray-300 space-y-1">
            <p>• This software contains proprietary and confidential information</p>
            <p>• Unauthorized copying, distribution, or reverse engineering is strictly prohibited</p>
            <p>• Protected by U.S. and international copyright laws, patents, and trade secrets</p>
            <p>• Violations subject to civil and criminal penalties</p>
          </div>
        </div>

        {/* Confidentiality Notice */}
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <h4 className="font-bold text-red-400 mb-2">DETROIT STAKEHOLDER CONFIDENTIALITY NOTICE</h4>
          <p className="text-sm text-gray-300">
            This demonstration is provided under strict confidentiality for authorized Detroit municipal 
            stakeholders only. All technologies shown are proprietary innovations of OriginLedger Technologies, LLC. 
            By accessing this system, you agree to maintain confidentiality and use information solely for 
            partnership evaluation purposes.
          </p>
        </div>

        {/* Contact & Legal */}
        <div className="border-t border-gray-700 pt-6 mt-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">Legal Department</h4>
              <p className="text-gray-400">legal@originledger.com</p>
              <p className="text-gray-400">1-800-ORIGIN-IP</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Partnership Inquiries</h4>
              <p className="text-gray-400">partnerships@originledger.com</p>
              <p className="text-gray-400">Authorized Municipal Partners Only</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">DMCA Compliance</h4>
              <p className="text-gray-400">dmca@originledger.com</p>
              <p className="text-gray-400">24-hour response guarantee</p>
            </div>
          </div>
        </div>

        {/* Final Warning */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-xs text-red-400 font-semibold">
            VIOLATION OF THESE INTELLECTUAL PROPERTY RIGHTS MAY RESULT IN IMMEDIATE LEGAL ACTION
          </p>
        </div>
      </div>
    </div>
  );
}