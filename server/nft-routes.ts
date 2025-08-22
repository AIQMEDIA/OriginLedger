import { Express } from 'express';
import { body, validationResult } from 'express-validator';
import { IStorage } from './storage';
import { requireAuth, requireRole } from './middleware/auth';
import { traceSupplyChainEvent } from './middleware/tracing';

interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  totalSupply: number;
  availableShares: number;
  floorPrice: number;
  lastSalePrice: number;
  royaltyPercentage: number;
  standard: 'ERC-1155';
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

interface FractionalizationRequest {
  propertyId: string;
  totalShares: number;
  sharePrice: number;
  royaltyPercentage: number;
  allowPublicTrading: boolean;
  minimumPurchase: number;
}

interface NFTTradingOrder {
  type: 'buy' | 'sell';
  propertyId: string;
  shareAmount: number;
  pricePerShare: number;
  expirationDays: number;
}

interface SmartContractDeployment {
  contractAddress: string;
  deploymentTxHash: string;
  gasUsed: number;
  deploymentCost: number;
  abi: any[];
  verified: boolean;
}

export function setupNFTRoutes(app: Express, storage: IStorage) {
  
  // ========================
  // NFT PROPERTY MANAGEMENT
  // ========================

  // Get all NFT-enabled properties
  app.get('/api/nft/properties', async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      
      // Filter for NFT-enabled properties and enhance with metadata
      const nftProperties = properties
        .filter(property => property.metadata?.nftEnabled)
        .map(property => {
          const nftMetadata: NFTMetadata = {
            tokenId: `DET-NFT-${property.propertyId.replace('DET-', '')}`,
            contractAddress: '0x742d35Cc5Cc5C6f4C2C5f2E76a9e9A4e3d3C8C9d',
            totalSupply: property.metadata?.totalShares || 1000,
            availableShares: property.metadata?.availableShares || 250,
            floorPrice: property.metadata?.floorPrice || Math.floor((property.assessedValue! / 100) / (property.metadata?.totalShares || 1000)),
            lastSalePrice: property.metadata?.lastSalePrice || 0,
            royaltyPercentage: property.metadata?.royaltyPercentage || 2.5,
            standard: 'ERC-1155',
            attributes: [
              { trait_type: 'Location', value: property.metadata?.neighborhood || 'Detroit' },
              { trait_type: 'Property Type', value: property.metadata?.propertyType || 'Residential' },
              { trait_type: 'Square Footage', value: String(property.metadata?.squareFootage || 0) },
              { trait_type: 'Tax Status', value: property.taxOwed > 0 ? 'Outstanding' : 'Current' },
              { trait_type: 'Assessed Value', value: `$${(property.assessedValue! / 100).toLocaleString()}` }
            ]
          };

          // Generate mock ownership data
          const currentOwnership = [
            {
              id: `owner-${property.id}-1`,
              ownerId: property.ownerId,
              ownerName: 'Current Owner',
              fraction: 0.75,
              fractionPercent: '75.0%',
              acquiredAt: property.createdAt.toISOString(),
              acquisitionPrice: Math.floor(property.assessedValue! * 0.75 / 100),
              currentValue: Math.floor(property.assessedValue! * 0.75 / 100),
              nftTokenIds: [1, 2, 3, 750]
            },
            {
              id: `owner-${property.id}-2`,
              ownerId: 'public-investors',
              ownerName: 'Public Investors',
              fraction: 0.25,
              fractionPercent: '25.0%',
              acquiredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              acquisitionPrice: Math.floor(property.assessedValue! * 0.25 / 100),
              currentValue: Math.floor(property.assessedValue! * 0.25 / 100),
              nftTokenIds: [751, 752, 753, 1000]
            }
          ];

          // Generate mock trading activity
          const tradingActivity = [
            {
              id: `trade-${property.id}-1`,
              type: 'sale' as const,
              fromAddress: '0x1234...5678',
              toAddress: '0x8765...4321',
              tokenAmount: 10,
              pricePerToken: nftMetadata.floorPrice,
              totalPrice: 10 * nftMetadata.floorPrice,
              txHash: '0xABC123DEF456789012345678901234567890ABCDEF',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              gasUsed: 85000
            },
            {
              id: `trade-${property.id}-2`,
              type: 'mint' as const,
              toAddress: '0x742d35Cc5Cc5C6f4C2C5f2E76a9e9A4e3d3C8C9d',
              tokenAmount: 1000,
              pricePerToken: 0,
              totalPrice: 0,
              txHash: '0xDEF456ABC123789012345678901234567890ABCDEF',
              timestamp: property.createdAt.toISOString(),
              gasUsed: 120000
            },
            {
              id: `trade-${property.id}-3`,
              type: 'transfer' as const,
              fromAddress: '0x8765...4321',
              toAddress: '0x9876...1234',
              tokenAmount: 5,
              pricePerToken: nftMetadata.floorPrice * 1.05,
              totalPrice: 5 * nftMetadata.floorPrice * 1.05,
              txHash: '0x123ABC456DEF789012345678901234567890ABCDEF',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              gasUsed: 75000
            }
          ];

          return {
            ...property,
            assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`,
            nftMetadata,
            currentOwnership,
            tradingActivity
          };
        });

      res.json({
        message: 'NFT properties retrieved successfully',
        properties: nftProperties,
        total: nftProperties.length,
        marketStats: {
          totalMarketCap: nftProperties.reduce((sum, p) => sum + (p.assessedValue! / 100), 0),
          totalInvestors: 847,
          volume24h: 48200,
          activeContracts: nftProperties.length
        }
      });
    } catch (error) {
      console.error('Error fetching NFT properties:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve NFT properties',
        code: 'NFT_PROPERTIES_ERROR'
      });
    }
  });

  // ========================
  // PROPERTY FRACTIONALIZATION
  // ========================

  // Fractionalize property into NFT shares
  app.post('/api/nft/fractionalize',
    requireAuth,
    [
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('totalShares').isInt({ min: 100, max: 10000 }).withMessage('Total shares must be between 100-10,000'),
      body('sharePrice').isFloat({ min: 0.01 }).withMessage('Share price must be positive'),
      body('royaltyPercentage').isFloat({ min: 0, max: 10 }).withMessage('Royalty must be 0-10%'),
      body('minimumPurchase').isInt({ min: 1 }).withMessage('Minimum purchase must be at least 1')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const {
        propertyId,
        totalShares,
        sharePrice,
        royaltyPercentage,
        allowPublicTrading,
        minimumPurchase
      }: FractionalizationRequest = req.body;

      await traceSupplyChainEvent('NFT.Property.Fractionalize', {
        propertyId,
        totalShares,
        sharePrice,
        royaltyPercentage,
        userId: (req as any).user?.id
      }, async () => {
        try {
          // Get property to fractionalize
          const property = await storage.getProperty(propertyId);
          if (!property) {
            return res.status(404).json({
              error: 'Property not found',
              code: 'PROPERTY_NOT_FOUND'
            });
          }

          // Simulate smart contract deployment
          const contractDeployment: SmartContractDeployment = {
            contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
            deploymentTxHash: `0x${Math.random().toString(16).substring(2, 66)}`,
            gasUsed: 2850000,
            deploymentCost: 45.67,
            abi: [
              {
                "type": "function",
                "name": "balanceOf",
                "inputs": [
                  {"name": "account", "type": "address"},
                  {"name": "id", "type": "uint256"}
                ],
                "outputs": [{"name": "", "type": "uint256"}]
              },
              {
                "type": "function",
                "name": "safeTransferFrom",
                "inputs": [
                  {"name": "from", "type": "address"},
                  {"name": "to", "type": "address"},
                  {"name": "id", "type": "uint256"},
                  {"name": "amount", "type": "uint256"},
                  {"name": "data", "type": "bytes"}
                ]
              }
            ],
            verified: true
          };

          // Update property with NFT metadata
          const nftMetadata = {
            nftEnabled: true,
            totalShares,
            availableShares: totalShares,
            sharePrice,
            royaltyPercentage,
            allowPublicTrading,
            minimumPurchase,
            contractAddress: contractDeployment.contractAddress,
            deploymentTxHash: contractDeployment.deploymentTxHash,
            tokenStandard: 'ERC-1155',
            floorPrice: sharePrice,
            lastSalePrice: 0,
            totalVolume: 0,
            createdAt: new Date().toISOString()
          };

          await storage.updateProperty(property.id, {
            metadata: {
              ...property.metadata,
              ...nftMetadata
            },
            updatedAt: new Date()
          });

          // Create initial ownership record for the property owner
          await storage.addOwnership({
            propertyId: property.id,
            ownerId: property.ownerId,
            fraction: '1.0',
            metadata: {
              nftShares: totalShares,
              contractAddress: contractDeployment.contractAddress,
              tokenIds: Array.from({length: totalShares}, (_, i) => i + 1),
              fractionalizationEvent: true,
              initialOwner: true
            }
          });

          res.status(201).json({
            message: 'Property successfully fractionalized into NFT shares',
            property: {
              id: property.id,
              propertyId: property.propertyId,
              totalShares,
              sharePrice,
              marketCap: totalShares * sharePrice
            },
            contract: contractDeployment,
            nftMetadata: {
              tokenId: `DET-NFT-${property.propertyId.replace('DET-', '')}`,
              standard: 'ERC-1155',
              totalSupply: totalShares,
              royaltyPercentage,
              attributes: [
                { trait_type: 'Location', value: property.metadata?.neighborhood || 'Detroit' },
                { trait_type: 'Property Type', value: property.metadata?.propertyType || 'Residential' },
                { trait_type: 'Total Shares', value: String(totalShares) },
                { trait_type: 'Share Price', value: `$${sharePrice}` }
              ]
            },
            trading: {
              openSeaUrl: `https://opensea.io/assets/ethereum/${contractDeployment.contractAddress}/1`,
              looksRareUrl: `https://looksrare.org/collections/${contractDeployment.contractAddress}`,
              x2y2Url: `https://x2y2.io/eth/${contractDeployment.contractAddress}/1`
            }
          });
        } catch (error) {
          console.error('Error fractionalizing property:', error);
          res.status(500).json({ 
            error: 'Failed to fractionalize property',
            code: 'FRACTIONALIZATION_ERROR'
          });
        }
      });
    }
  );

  // ========================
  // NFT TRADING SYSTEM
  // ========================

  // Execute NFT share trade
  app.post('/api/nft/trade',
    requireAuth,
    [
      body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
      body('propertyId').notEmpty().withMessage('Property ID is required'),
      body('shareAmount').isInt({ min: 1 }).withMessage('Share amount must be positive'),
      body('pricePerShare').isFloat({ min: 0.01 }).withMessage('Price per share must be positive'),
      body('expirationDays').isInt({ min: 1, max: 30 }).withMessage('Expiration must be 1-30 days')
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }

      const {
        type,
        propertyId,
        shareAmount,
        pricePerShare,
        expirationDays
      }: NFTTradingOrder = req.body;

      await traceSupplyChainEvent('NFT.Trade.Execute', {
        type,
        propertyId,
        shareAmount,
        pricePerShare,
        totalValue: shareAmount * pricePerShare,
        userId: (req as any).user?.id
      }, async () => {
        try {
          const property = await storage.getProperty(propertyId);
          if (!property) {
            return res.status(404).json({
              error: 'Property not found',
              code: 'PROPERTY_NOT_FOUND'
            });
          }

          if (!property.metadata?.nftEnabled) {
            return res.status(400).json({
              error: 'Property is not fractionalized',
              code: 'NOT_NFT_ENABLED'
            });
          }

          // Simulate blockchain transaction
          const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
          const gasUsed = 85000 + Math.floor(Math.random() * 20000);
          const gasPrice = 25; // Gwei
          const gasFee = (gasUsed * gasPrice) / 1e9; // ETH
          const gasFeeUSD = gasFee * 2000; // Assume ETH = $2000

          // Calculate fees
          const totalTradeValue = shareAmount * pricePerShare;
          const royaltyFee = totalTradeValue * (property.metadata.royaltyPercentage || 2.5) / 100;
          const platformFee = totalTradeValue * 0.005; // 0.5% platform fee
          const netAmount = type === 'sell' ? totalTradeValue - royaltyFee - platformFee : totalTradeValue;

          // Create trade record
          const tradeRecord = {
            id: `trade-${Date.now()}`,
            type,
            propertyId: property.id,
            traderId: (req as any).user.id,
            shareAmount,
            pricePerShare,
            totalValue: totalTradeValue,
            royaltyFee,
            platformFee,
            gasFee: gasFeeUSD,
            netAmount,
            txHash,
            gasUsed,
            status: 'completed',
            timestamp: new Date().toISOString(),
            blockNumber: 18500000 + Math.floor(Math.random() * 10000),
            confirmations: 12
          };

          // Update property trading stats
          const updatedMetadata = {
            ...property.metadata,
            lastSalePrice: pricePerShare,
            totalVolume: (property.metadata.totalVolume || 0) + totalTradeValue,
            lastTradeAt: new Date().toISOString()
          };

          if (type === 'buy') {
            updatedMetadata.availableShares = Math.max(0, (property.metadata.availableShares || 0) - shareAmount);
          } else {
            updatedMetadata.availableShares = (property.metadata.availableShares || 0) + shareAmount;
          }

          await storage.updateProperty(property.id, {
            metadata: updatedMetadata,
            updatedAt: new Date()
          });

          // Record the trade
          await storage.recordPayment({
            propertyId: property.id,
            payerId: (req as any).user.id,
            amount: Math.floor(totalTradeValue * 100), // Convert to cents
            paymentMethod: 'crypto',
            txHash,
            status: 'completed',
            context: {
              reason: `NFT Share ${type === 'buy' ? 'Purchase' : 'Sale'}`,
              tradeType: type,
              shareAmount,
              pricePerShare,
              royaltyFee,
              platformFee,
              gasFee: gasFeeUSD,
              contractAddress: property.metadata.contractAddress
            }
          });

          res.status(201).json({
            message: `NFT share ${type} order executed successfully`,
            trade: tradeRecord,
            transaction: {
              hash: txHash,
              blockNumber: tradeRecord.blockNumber,
              gasUsed,
              gasFee: gasFeeUSD,
              confirmations: 12,
              status: 'success'
            },
            breakdown: {
              shareAmount,
              pricePerShare,
              subtotal: totalTradeValue,
              royaltyFee: type === 'sell' ? royaltyFee : 0,
              platformFee: type === 'sell' ? platformFee : 0,
              gasFee: gasFeeUSD,
              netAmount
            },
            property: {
              id: property.id,
              propertyId: property.propertyId,
              availableShares: updatedMetadata.availableShares,
              lastSalePrice: pricePerShare,
              totalVolume: updatedMetadata.totalVolume
            },
            marketplaces: {
              openSea: `https://opensea.io/assets/ethereum/${property.metadata.contractAddress}/1`,
              etherscan: `https://etherscan.io/tx/${txHash}`
            }
          });
        } catch (error) {
          console.error('Error executing NFT trade:', error);
          res.status(500).json({ 
            error: 'Failed to execute trade',
            code: 'TRADE_EXECUTION_ERROR'
          });
        }
      });
    }
  );

  // ========================
  // MARKET DATA & ANALYTICS
  // ========================

  // Get NFT market data and analytics
  app.get('/api/nft/market-data', async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      const nftProperties = properties.filter(p => p.metadata?.nftEnabled);

      // Calculate market statistics
      const totalMarketCap = nftProperties.reduce((sum, p) => {
        const totalShares = p.metadata?.totalShares || 0;
        const sharePrice = p.metadata?.sharePrice || 0;
        return sum + (totalShares * sharePrice);
      }, 0);

      const totalVolume24h = nftProperties.reduce((sum, p) => {
        return sum + (p.metadata?.totalVolume || 0);
      }, 0);

      const averageRoyalty = nftProperties.reduce((sum, p) => {
        return sum + (p.metadata?.royaltyPercentage || 0);
      }, 0) / Math.max(nftProperties.length, 1);

      // Top performing properties
      const topProperties = nftProperties
        .sort((a, b) => (b.metadata?.totalVolume || 0) - (a.metadata?.totalVolume || 0))
        .slice(0, 5)
        .map(p => ({
          propertyId: p.propertyId,
          address: p.address,
          volume: p.metadata?.totalVolume || 0,
          lastSalePrice: p.metadata?.lastSalePrice || 0,
          priceChange24h: Math.floor(Math.random() * 20) - 10 // Mock data
        }));

      // Recent trades
      const recentTrades = [
        {
          propertyId: 'DET-0012345',
          type: 'sale',
          shares: 15,
          price: 275,
          total: 4125,
          txHash: '0xABC123...',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          propertyId: 'DET-0012346',
          type: 'sale',
          shares: 8,
          price: 450,
          total: 3600,
          txHash: '0xDEF456...',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];

      res.json({
        timestamp: new Date().toISOString(),
        market: {
          totalMarketCap,
          totalProperties: nftProperties.length,
          volume24h: totalVolume24h,
          averageRoyalty,
          totalInvestors: 847,
          activeContracts: nftProperties.length
        },
        trending: {
          topProperties,
          priceMovers: topProperties.slice(0, 3),
          volumeLeaders: topProperties.slice(0, 3)
        },
        activity: {
          recentTrades,
          totalTrades: 156,
          averageTradeSize: 1875
        },
        analytics: {
          ownershipDistribution: {
            retail: 0.65,
            institutional: 0.25,
            founders: 0.10
          },
          tradingPatterns: {
            dailyVolume: [45000, 52000, 38000, 61000, 48000, 55000, 42000],
            weeklyGrowth: 0.15,
            monthlyGrowth: 0.42
          }
        }
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve market data',
        code: 'MARKET_DATA_ERROR'
      });
    }
  });

  // Get specific property NFT details
  app.get('/api/nft/properties/:id', async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND'
        });
      }

      if (!property.metadata?.nftEnabled) {
        return res.status(400).json({
          error: 'Property is not NFT-enabled',
          code: 'NOT_NFT_ENABLED'
        });
      }

      // Get ownership records
      const owners = await storage.getOwners(property.id);
      const payments = await storage.getPaymentsByProperty(property.id);
      
      // Filter for NFT-related payments
      const nftTrades = payments.filter(p => p.context?.tradeType);

      const response = {
        property: {
          ...property,
          assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`
        },
        nft: {
          tokenId: `DET-NFT-${property.propertyId.replace('DET-', '')}`,
          contractAddress: property.metadata.contractAddress,
          standard: 'ERC-1155',
          totalSupply: property.metadata.totalShares,
          availableShares: property.metadata.availableShares,
          floorPrice: property.metadata.floorPrice,
          lastSalePrice: property.metadata.lastSalePrice,
          totalVolume: property.metadata.totalVolume,
          royaltyPercentage: property.metadata.royaltyPercentage
        },
        ownership: owners.map(owner => ({
          ...owner,
          fractionPercent: `${(parseFloat(owner.fraction) * 100).toFixed(1)}%`,
          nftShares: owner.metadata?.nftShares || 0
        })),
        trading: {
          recentTrades: nftTrades.slice(-10).map(trade => ({
            id: trade.id,
            type: trade.context?.tradeType || 'unknown',
            amount: trade.amount,
            amountFormatted: `$${(trade.amount / 100).toLocaleString()}`,
            shareAmount: trade.context?.shareAmount || 0,
            pricePerShare: trade.context?.pricePerShare || 0,
            txHash: trade.txHash,
            timestamp: trade.timestamp
          })),
          totalTrades: nftTrades.length,
          volume: nftTrades.reduce((sum, trade) => sum + trade.amount, 0)
        },
        marketplaces: {
          openSea: `https://opensea.io/assets/ethereum/${property.metadata.contractAddress}/1`,
          looksRare: `https://looksrare.org/collections/${property.metadata.contractAddress}`,
          etherscan: `https://etherscan.io/address/${property.metadata.contractAddress}`
        }
      };

      res.json({
        message: 'NFT property details retrieved',
        ...response
      });
    } catch (error) {
      console.error('Error fetching NFT property details:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve NFT property details',
        code: 'NFT_PROPERTY_ERROR'
      });
    }
  });

  // ========================
  // PORTFOLIO & USER DATA
  // ========================

  // Get user's NFT portfolio
  app.get('/api/nft/portfolio', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      
      // Get user's ownership records
      const ownerships = await storage.getOwnerships(userId);
      
      // Get properties for owned shares
      const portfolioProperties = await Promise.all(
        ownerships.map(async (ownership) => {
          const property = await storage.getProperty(ownership.propertyId);
          if (property && property.metadata?.nftEnabled) {
            const currentValue = (property.metadata.lastSalePrice || property.metadata.sharePrice || 0) * 
                               (ownership.metadata?.nftShares || 0);
            
            return {
              property: {
                id: property.id,
                propertyId: property.propertyId,
                address: property.address,
                assessedValueFormatted: `$${(property.assessedValue! / 100).toLocaleString()}`
              },
              ownership: {
                ...ownership,
                fractionPercent: `${(parseFloat(ownership.fraction) * 100).toFixed(1)}%`,
                nftShares: ownership.metadata?.nftShares || 0,
                currentValue,
                currentValueFormatted: `$${currentValue.toLocaleString()}`
              },
              nft: {
                tokenId: `DET-NFT-${property.propertyId.replace('DET-', '')}`,
                contractAddress: property.metadata.contractAddress,
                floorPrice: property.metadata.floorPrice,
                lastSalePrice: property.metadata.lastSalePrice
              }
            };
          }
          return null;
        })
      );

      const validPortfolio = portfolioProperties.filter(Boolean);
      
      // Calculate portfolio stats
      const totalValue = validPortfolio.reduce((sum, item) => 
        sum + (item?.ownership.currentValue || 0), 0);
      
      const totalShares = validPortfolio.reduce((sum, item) => 
        sum + (item?.ownership.nftShares || 0), 0);

      res.json({
        message: 'NFT portfolio retrieved',
        portfolio: validPortfolio,
        stats: {
          totalProperties: validPortfolio.length,
          totalShares,
          totalValue,
          totalValueFormatted: `$${totalValue.toLocaleString()}`,
          averageHolding: validPortfolio.length > 0 ? totalValue / validPortfolio.length : 0
        }
      });
    } catch (error) {
      console.error('Error fetching NFT portfolio:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve NFT portfolio',
        code: 'PORTFOLIO_ERROR'
      });
    }
  });
}