import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitControls } from "@/components/git-controls";
import { Building2, GitBranch, FileText, Clock } from "lucide-react";

export function GitManagement() {
  const { data: gitStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/git/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <GitBranch className="h-8 w-8 text-blue-600" />
                Git Repository Management
                <span className="text-base text-red-600 font-normal">™</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Version control for OriginLedger IP-protected codebase
              </p>
              <p className="text-xs text-red-600 mt-1 font-semibold">
                © 2025 OriginLedger Technologies, LLC - Proprietary & Confidential
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              GitHub Integration
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Git Controls */}
          <div className="lg:col-span-2">
            <GitControls />
          </div>

          {/* Repository Status */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Repository Status
                </CardTitle>
                <CardDescription>
                  Current branch and commit information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : gitStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Branch:</span>
                      <Badge variant="secondary">{gitStatus.branch}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Commit:</span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {gitStatus.lastCommit}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Changes:</span>
                      <Badge variant={gitStatus.hasChanges ? "destructive" : "secondary"}>
                        {gitStatus.hasChanges ? `${gitStatus.files?.length || 0} files` : 'Clean'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Failed to load Git status</p>
                )}
              </CardContent>
            </Card>

            {/* Changed Files */}
            {gitStatus?.hasChanges && gitStatus.files && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Modified Files
                  </CardTitle>
                  <CardDescription>
                    Files with uncommitted changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gitStatus.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge 
                          variant="outline" 
                          className={`w-8 text-xs ${
                            file.status.includes('M') ? 'text-blue-600' :
                            file.status.includes('A') ? 'text-green-600' :
                            file.status.includes('D') ? 'text-red-600' :
                            'text-gray-600'
                          }`}
                        >
                          {file.status}
                        </Badge>
                        <span className="font-mono text-xs truncate">{file.file}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Git Workflow Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Git Workflow
                </CardTitle>
                <CardDescription>
                  Recommended workflow for IP-protected development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <span>Make your changes to the OriginLedger codebase</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <span>Write a descriptive commit message</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <span>Click "Commit Changes" to save locally</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">4</Badge>
                    <span>Click "Push to GitHub" to sync remotely</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                    IP Protection Notice: All commits include proprietary technology claims and legal protection notices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}