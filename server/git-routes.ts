import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();

interface GitCommitResult {
  commit: string;
  branch: string;
  files: string[];
}

interface GitPushResult {
  remote: string;
  branch: string;
  status: string;
}

// Git commit endpoint
router.post('/commit', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Commit message is required',
        __copyright: '© 2025 OriginLedger Technologies, LLC',
        __legal_notice: 'PROPRIETARY & CONFIDENTIAL'
      });
    }

    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    // Stage all changes
    await execAsync('git add .');
    
    // Check if there are changes to commit
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    if (!statusOutput.trim()) {
      return res.json({
        message: 'No changes to commit',
        branch: currentBranch,
        commit: 'up-to-date',
        __copyright: '© 2025 OriginLedger Technologies, LLC',
        __legal_notice: 'PROPRIETARY & CONFIDENTIAL'
      });
    }

    // Enhanced commit message with IP protection notice
    const enhancedMessage = `${message.trim()}

© 2025 OriginLedger Technologies, LLC
PROPRIETARY & CONFIDENTIAL: Contains patent-pending municipal blockchain technologies
Detroit Civic Blockchain Platform™ - Unauthorized copying prohibited`;

    // Commit changes
    await execAsync(`git commit -m "${enhancedMessage.replace(/"/g, '\\"')}"`);
    
    // Get the latest commit hash
    const { stdout: commitOutput } = await execAsync('git rev-parse --short HEAD');
    const commitHash = commitOutput.trim();

    // Get list of files changed
    const { stdout: filesOutput } = await execAsync('git diff-tree --no-commit-id --name-only -r HEAD');
    const files = filesOutput.trim().split('\n').filter(f => f);

    console.log(`🔒 GIT COMMIT PROTECTED: ${commitHash} | Message: "${message}" | Files: ${files.length}`);

    const result: GitCommitResult = {
      commit: commitHash,
      branch: currentBranch,
      files: files
    };

    res.json({
      ...result,
      message: `Successfully committed ${files.length} files`,
      __copyright: '© 2025 OriginLedger Technologies, LLC',
      __legal_notice: 'PROPRIETARY & CONFIDENTIAL - Detroit stakeholder evaluation only',
      __patent_status: 'Patent Pending Technologies - Unauthorized copying prohibited'
    });

  } catch (error) {
    console.error('Git commit error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Git commit failed',
      details: 'Please ensure Git is configured with user.name and user.email',
      __copyright: '© 2025 OriginLedger Technologies, LLC',
      __legal_notice: 'PROPRIETARY & CONFIDENTIAL'
    });
  }
});

// Git push endpoint
router.post('/push', async (req, res) => {
  try {
    // Get current branch
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim();

    // Get remote info
    const { stdout: remoteOutput } = await execAsync('git remote get-url origin');
    const remoteUrl = remoteOutput.trim();
    const remoteName = remoteUrl.includes('github.com') ? 'github' : 'origin';

    // Push to remote
    const { stdout: pushOutput, stderr: pushError } = await execAsync(`git push origin ${currentBranch}`);
    
    console.log(`🔒 GIT PUSH PROTECTED: ${currentBranch} → ${remoteName} | IP Protected Codebase`);

    const result: GitPushResult = {
      remote: remoteName,
      branch: currentBranch,
      status: 'success'
    };

    res.json({
      ...result,
      message: `Successfully pushed to ${remoteName}/${currentBranch}`,
      output: pushOutput || pushError,
      __copyright: '© 2025 OriginLedger Technologies, LLC',
      __legal_notice: 'PROPRIETARY & CONFIDENTIAL - Detroit stakeholder evaluation only',
      __patent_status: 'Patent Pending Technologies - Unauthorized copying prohibited'
    });

  } catch (error) {
    console.error('Git push error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Git push failed',
      details: 'Please ensure GitHub authentication is configured (SSH key or token)',
      __copyright: '© 2025 OriginLedger Technologies, LLC',
      __legal_notice: 'PROPRIETARY & CONFIDENTIAL'
    });
  }
});

// Git status endpoint
router.get('/status', async (req, res) => {
  try {
    const { stdout: statusOutput } = await execAsync('git status --porcelain');
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const { stdout: commitOutput } = await execAsync('git rev-parse --short HEAD');
    
    const hasChanges = statusOutput.trim().length > 0;
    const files = statusOutput.trim().split('\n').filter(f => f).map(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      return { status: status.trim(), file };
    });

    res.json({
      branch: branchOutput.trim(),
      lastCommit: commitOutput.trim(),
      hasChanges,
      files,
      __copyright: '© 2025 OriginLedger Technologies, LLC',
      __legal_notice: 'PROPRIETARY & CONFIDENTIAL',
      __patent_status: 'Patent Pending Technologies'
    });

  } catch (error) {
    console.error('Git status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Git status failed',
      __copyright: '© 2025 OriginLedger Technologies, LLC'
    });
  }
});

export { router as gitRoutes };