import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import BlockchainExplorer from "@/components/blockchain/blockchain-explorer";
import BlockDetails from "@/components/blockchain/block-details";
import { useState } from "react";

export default function Blockchain() {
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  
  const { data: blockchainData, isLoading } = useQuery({
    queryKey: ['/api/chain'],
    queryFn: api.getBlockchain,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const blockchain = blockchainData?.chain || [];

  return (
    <div className="space-y-6">
      <BlockchainExplorer 
        blockchain={blockchain}
        onBlockSelect={setSelectedBlock}
        selectedBlock={selectedBlock}
      />
      
      <BlockDetails 
        block={selectedBlock || blockchain[blockchain.length - 1]}
      />
    </div>
  );
}
