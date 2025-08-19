import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Block {
  index: number;
  timestamp: number;
  data: any;
  hash: string;
  prev_hash: string;
}

interface BlockchainExplorerProps {
  blockchain: Block[];
  onBlockSelect: (block: Block) => void;
  selectedBlock?: Block;
}

const getBlockColor = (index: number) => {
  if (index === 0) return "from-primary to-blue-600";
  if (index % 3 === 0) return "from-accent to-green-600"; 
  if (index % 2 === 0) return "from-warning to-orange-600";
  return "from-purple-500 to-purple-600";
};

export default function BlockchainExplorer({ 
  blockchain, 
  onBlockSelect, 
  selectedBlock 
}: BlockchainExplorerProps) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
              Blockchain Explorer
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interactive chain visualization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-list-view"
            >
              <List size={16} className="mr-1" />
              List View
            </Button>
            <Button 
              size="sm"
              data-testid="button-graph-view"
            >
              <GitBranch size={16} className="mr-1" />
              Graph View
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {blockchain.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No blocks in the blockchain yet</p>
          </div>
        ) : (
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {blockchain.map((block, index) => (
              <div key={block.index} className="flex items-center space-x-4 flex-shrink-0">
                <div
                  onClick={() => onBlockSelect(block)}
                  className={`
                    bg-gradient-to-br ${getBlockColor(block.index)} 
                    rounded-lg p-4 text-white min-w-[200px] cursor-pointer
                    transition-all hover:scale-105
                    ${selectedBlock?.index === block.index ? 'ring-2 ring-white shadow-lg' : ''}
                  `}
                  data-testid={`block-${block.index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Block #{block.index}</span>
                    <div className="w-4 h-4 bg-white/20 rounded"></div>
                  </div>
                  <p className="text-xs text-white/80 mb-2">
                    {block.index === 0 ? 'Genesis Block' : block.data?.action || 'Unknown'}
                  </p>
                  <p className="text-xs text-white/70 truncate">
                    Hash: {block.hash?.slice(0, 10)}...
                  </p>
                  <p className="text-xs text-white/70 mt-2">
                    {formatDistanceToNow(new Date(block.timestamp * 1000), { addSuffix: true })}
                  </p>
                </div>
                
                {index < blockchain.length - 1 && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
