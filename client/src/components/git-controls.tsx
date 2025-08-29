import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, GitCommit, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitStatus {
  status: 'idle' | 'committing' | 'pushing' | 'success' | 'error';
  message?: string;
  branch?: string;
  lastCommit?: string;
}

export function GitControls() {
  const [commitMessage, setCommitMessage] = useState("");
  const [gitStatus, setGitStatus] = useState<GitStatus>({ status: 'idle' });
  const { toast } = useToast();

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast({
        title: "Commit Message Required",
        description: "Please enter a commit message",
        variant: "destructive"
      });
      return;
    }

    setGitStatus({ status: 'committing', message: 'Staging and committing changes...' });

    try {
      const response = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage })
      });

      const result = await response.json();

      if (response.ok) {
        setGitStatus({ 
          status: 'success', 
          message: `Committed: ${result.commit}`,
          lastCommit: result.commit,
          branch: result.branch
        });
        setCommitMessage("");
        toast({
          title: "Changes Committed",
          description: `Successfully committed to ${result.branch}`,
        });
      } else {
        throw new Error(result.error || 'Commit failed');
      }
    } catch (error) {
      setGitStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Commit failed'
      });
      toast({
        title: "Commit Failed",
        description: "Please check your Git configuration",
        variant: "destructive"
      });
    }
  };

  const handlePush = async () => {
    setGitStatus({ status: 'pushing', message: 'Pushing to GitHub...' });

    try {
      const response = await fetch('/api/git/push', {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        setGitStatus({ 
          status: 'success', 
          message: `Pushed to ${result.remote}/${result.branch}`,
          branch: result.branch
        });
        toast({
          title: "Changes Pushed",
          description: `Successfully pushed to GitHub ${result.branch}`,
        });
      } else {
        throw new Error(result.error || 'Push failed');
      }
    } catch (error) {
      setGitStatus({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Push failed'
      });
      toast({
        title: "Push Failed",
        description: "Please check your GitHub authentication",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (gitStatus.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <GitBranch className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (gitStatus.status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'committing':
      case 'pushing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5" />
          Git Sync Controls
          <Badge variant="outline" className="ml-auto">
            GitHub Integration
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {gitStatus.message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{gitStatus.message}</span>
            {gitStatus.branch && (
              <Badge variant="secondary" className="ml-auto">
                {gitStatus.branch}
              </Badge>
            )}
          </div>
        )}

        {/* Commit Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Commit Message</label>
            <Input
              placeholder="feat: add comprehensive IP protection system"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={gitStatus.status === 'committing' || gitStatus.status === 'pushing'}
              data-testid="input-commit-message"
            />
          </div>
          
          <Button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || gitStatus.status === 'committing' || gitStatus.status === 'pushing'}
            className="w-full"
            data-testid="button-commit"
          >
            <GitCommit className="h-4 w-4 mr-2" />
            {gitStatus.status === 'committing' ? 'Committing...' : 'Commit Changes'}
          </Button>
        </div>

        {/* Push Section */}
        <div className="pt-2 border-t">
          <Button
            onClick={handlePush}
            variant="outline"
            disabled={gitStatus.status === 'committing' || gitStatus.status === 'pushing'}
            className="w-full"
            data-testid="button-push"
          >
            <Upload className="h-4 w-4 mr-2" />
            {gitStatus.status === 'pushing' ? 'Pushing...' : 'Push to GitHub'}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCommitMessage("feat: enhanced municipal blockchain features")}
              disabled={gitStatus.status === 'committing' || gitStatus.status === 'pushing'}
              data-testid="button-quick-feat"
            >
              Quick: Feature
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCommitMessage("fix: resolve IP protection implementation")}
              disabled={gitStatus.status === 'committing' || gitStatus.status === 'pushing'}
              data-testid="button-quick-fix"
            >
              Quick: Fix
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-3">
          <p className="font-semibold text-red-600">IP Protection Notice:</p>
          <p>All commits include proprietary OriginLedger™ technologies. Unauthorized copying prohibited.</p>
        </div>
      </CardContent>
    </Card>
  );
}