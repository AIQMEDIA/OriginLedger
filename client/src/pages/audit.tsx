import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, Calendar, User, Package } from "lucide-react";
import { format } from "date-fns";

interface AuditEntry {
  eventId: string;
  blockIndex: number | string;
  blockHash: string;
  timestamp: string;
  participant: string;
  participantRole: string;
  action: string;
  assetId: string;
  assetName: string;
  location: string;
  metadata?: any;
}

export default function Audit() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [assetId, setAssetId] = useState("");

  // Chain validation query
  const { data: validationData, isLoading: validationLoading } = useQuery({
    queryKey: ['/api/chain/validate'],
    queryFn: api.validateChain,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Audit log query
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['/api/audit-log', { startDate, endDate, participantId, assetId }],
    queryFn: () => api.getAuditLog({ startDate, endDate, participantId, assetId }),
    enabled: false // Only run when manually triggered
  });

  // Participants for filter dropdown
  const { data: participantsList } = useQuery({
    queryKey: ['/api/participants-list'],
    queryFn: api.getParticipantsList
  });

  // Assets for filter dropdown
  const { data: assetsData } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: () => api.getAssets({ limit: 100 })
  });

  const handleGenerateAudit = () => {
    refetchAudit();
  };

  const handleDownloadCSV = async () => {
    try {
      const csvData = await api.getAuditLog({ 
        startDate, 
        endDate, 
        participantId, 
        assetId, 
        format: 'csv' 
      });
      
      const blob = new Blob([csvData as string], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `originledger-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CSV:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary dark:text-white mb-2">
          Audit & Compliance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View audit logs, validate blockchain integrity, and export compliance reports.
        </p>
      </div>

      {/* Chain Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : validationData?.valid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            Blockchain Integrity Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Chain Status
                </Label>
                <Badge variant={validationData.valid ? "default" : "destructive"}>
                  {validationData.valid ? "Valid" : "Invalid"}
                </Badge>
              </div>
              {validationData.valid && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Blocks
                    </Label>
                    <p className="text-lg font-semibold">{validationData.totalBlocks}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Validated
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(validationData.validatedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </>
              )}
              {!validationData.valid && validationData.error && (
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium text-red-500">Error Details</Label>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {validationData.error} 
                    {validationData.blockIndex !== undefined && ` (Block ${validationData.blockIndex})`}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Audit Log Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant-filter">Participant</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger>
                  <SelectValue placeholder="All participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All participants</SelectItem>
                  {participantsList?.map((participant: any) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      {participant.username} ({participant.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-filter">Asset</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="All assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All assets</SelectItem>
                  {assetsData?.assets?.map((asset: any) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.assetId} - {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateAudit}
              disabled={auditLoading}
              data-testid="button-generate-audit"
            >
              {auditLoading ? "Generating..." : "Generate Audit Log"}
            </Button>
            {auditData?.auditEntries && (
              <Button 
                variant="outline" 
                onClick={handleDownloadCSV}
                data-testid="button-download-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Results */}
      {auditData && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log Results</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {auditData.auditEntries.length} events found
              {auditData.summary.dateRange.start && (
                ` from ${auditData.summary.dateRange.start} to ${auditData.summary.dateRange.end || 'present'}`
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditData.auditEntries.map((entry: AuditEntry) => (
                <div 
                  key={entry.eventId} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  data-testid={`audit-entry-${entry.eventId}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{entry.participant}</span>
                        <Badge variant="outline" className="text-xs">
                          {entry.participantRole}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm:ss")}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">{entry.assetId}</span>
                      </div>
                      <Badge className="text-xs">{entry.action}</Badge>
                      {entry.location && (
                        <p className="text-xs text-gray-500">📍 {entry.location}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">
                        Block #{entry.blockIndex}
                      </div>
                      <p className="text-xs font-mono text-gray-400 truncate">
                        {entry.blockHash}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}