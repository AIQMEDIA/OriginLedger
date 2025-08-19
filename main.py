"""
Supply Chain Blockchain MVP - Fully Annotated Flask Backend
===========================================================

This is a comprehensive supply chain blockchain application built with Flask.
It provides a simple but functional blockchain implementation for tracking
assets through various stages of the supply chain.

Key Features:
- In-memory blockchain storage (upgradeable to database)
- Participant management (manufacturers, shippers, retailers)
- Asset tracking with metadata support
- RESTful API with comprehensive endpoints
- Event logging and blockchain integrity

Author: AI Assistant
Version: 1.0
License: MIT
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import time
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

# Initialize Flask application
app = Flask(__name__)

# Enable CORS for frontend integration
# This allows the React frontend to make requests to this backend
CORS(app, origins=["http://localhost:5000", "http://0.0.0.0:5000"])

# ============================================================================
# DATA MODELS AND CLASSES
# ============================================================================

@dataclass
class Block:
    """
    Represents a single block in the blockchain.
    
    Each block contains:
    - index: Sequential number of the block
    - timestamp: When the block was created
    - data: The supply chain event data
    - prev_hash: Hash of the previous block (ensures chain integrity)
    - hash: This block's unique hash
    """
    index: int
    timestamp: float
    data: Dict[str, Any]
    prev_hash: str
    hash: str = None
    
    def __post_init__(self):
        """Calculate the hash after initialization if not provided."""
        if self.hash is None:
            self.hash = self.hash_block()
    
    def hash_block(self) -> str:
        """
        Calculate SHA-256 hash for this block.
        
        The hash is calculated using:
        - Block index
        - Timestamp
        - Data content
        - Previous block's hash
        
        This ensures any tampering with the block will be detected.
        """
        hash_input = f"{self.index}{self.timestamp}{json.dumps(self.data, sort_keys=True)}{self.prev_hash}"
        return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary for JSON serialization."""
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'prev_hash': self.prev_hash,
            'hash': self.hash
        }

class Blockchain:
    """
    Main blockchain class that manages the chain of blocks.
    
    This class handles:
    - Creating the genesis (first) block
    - Adding new blocks to the chain
    - Maintaining chain integrity
    - Providing chain data for API responses
    """
    
    def __init__(self):
        """Initialize blockchain with genesis block."""
        self.chain: List[Block] = []
        self.create_genesis_block()
    
    def create_genesis_block(self) -> Block:
        """
        Create the first block in the chain.
        
        The genesis block has:
        - Index 0
        - Current timestamp
        - Genesis action data
        - Previous hash "0" (since it's the first block)
        """
        genesis_block = Block(
            index=0,
            timestamp=time.time(),
            data={"action": "genesis", "message": "OriginLedger Blockchain Initialized"},
            prev_hash="0"
        )
        self.chain.append(genesis_block)
        return genesis_block
    
    def add_block(self, data: Dict[str, Any]) -> Block:
        """
        Add a new block to the chain.
        
        Args:
            data: Supply chain event data to store in the block
            
        Returns:
            The newly created block
            
        The new block's index will be the next sequential number,
        and its previous hash will be the hash of the current last block.
        """
        last_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            data=data,
            prev_hash=last_block.hash
        )
        self.chain.append(new_block)
        return new_block
    
    def get_chain(self) -> List[Dict[str, Any]]:
        """
        Get the complete blockchain as a list of dictionaries.
        
        Returns:
            List of all blocks in dictionary format for JSON serialization
        """
        return [block.to_dict() for block in self.chain]
    
    def get_latest_block(self) -> Block:
        """Get the most recently added block."""
        return self.chain[-1]
    
    def validate_chain(self) -> bool:
        """
        Validate the entire blockchain for integrity.
        
        Checks:
        1. Each block's hash is correctly calculated
        2. Each block's previous hash matches the previous block's hash
        
        Returns:
            True if chain is valid, False otherwise
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's hash is valid
            if current_block.hash != current_block.hash_block():
                return False
            
            # Check if current block's previous hash matches previous block's hash
            if current_block.prev_hash != previous_block.hash:
                return False
        
        return True

# ============================================================================
# GLOBAL APPLICATION STATE
# ============================================================================

# Initialize the blockchain instance
# In production, this would be replaced with a database-backed solution
blockchain = Blockchain()

# Participant registry: username -> role mapping
# Stores all registered participants in the supply chain
# Key: participant username, Value: their role (manufacturer, shipper, retailer, etc.)
participants: Dict[str, str] = {}

# Asset registry: asset_id -> asset information
# Tracks all assets moving through the supply chain
# Key: asset ID (like PRD-2024-001), Value: asset metadata
assets: Dict[str, Dict[str, Any]] = {}

# Event history: for quick lookups and statistics
# Stores additional event metadata beyond what's in the blockchain
events_history: List[Dict[str, Any]] = []

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def log_event(event_data: Dict[str, Any]) -> None:
    """
    Log an event to the events history for analytics and quick lookups.
    
    Args:
        event_data: The event data to log
    """
    event_entry = {
        **event_data,
        'timestamp': datetime.now().isoformat(),
        'block_index': len(blockchain.chain)
    }
    events_history.append(event_entry)

def get_participant_stats() -> Dict[str, int]:
    """
    Calculate statistics about participants by role.
    
    Returns:
        Dictionary with counts for each role and total participants
    """
    role_counts = {
        'manufacturers': 0,
        'shippers': 0,
        'retailers': 0,
        'other': 0
    }
    
    for role in participants.values():
        if role == 'manufacturer':
            role_counts['manufacturers'] += 1
        elif role == 'shipper':
            role_counts['shippers'] += 1
        elif role == 'retailer':
            role_counts['retailers'] += 1
        else:
            role_counts['other'] += 1
    
    role_counts['total'] = len(participants)
    return role_counts

def get_asset_statistics() -> Dict[str, Any]:
    """
    Calculate asset-related statistics for dashboard.
    
    Returns:
        Dictionary with asset counts and status information
    """
    if not assets:
        return {
            'total_assets': 0,
            'by_status': {},
            'recent_updates': 0
        }
    
    status_counts = {}
    recent_updates = 0
    current_time = time.time()
    
    for asset in assets.values():
        # Count by status
        status = asset.get('current_status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count recent updates (last hour)
        if current_time - asset.get('last_updated', 0) < 3600:
            recent_updates += 1
    
    return {
        'total_assets': len(assets),
        'by_status': status_counts,
        'recent_updates': recent_updates
    }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/register', methods=['POST'])
def register_participant():
    """
    Register a new participant in the supply chain.
    
    Expected JSON payload:
    {
        "user": "participant_username",
        "role": "manufacturer|shipper|retailer|other"
    }
    
    Returns:
        201: Success with confirmation message
        400: Invalid input data
        409: User already exists
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user = data.get('user', '').strip()
        role = data.get('role', '').strip().lower()
        
        # Validation
        if not user:
            return jsonify({'error': 'Username is required'}), 400
        
        if not role:
            return jsonify({'error': 'Role is required'}), 400
        
        valid_roles = ['manufacturer', 'shipper', 'retailer', 'other']
        if role not in valid_roles:
            return jsonify({
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }), 400
        
        # Check if user already exists
        if user in participants:
            return jsonify({'error': f'User {user} already exists'}), 409
        
        # Register the participant
        participants[user] = role
        
        # Log the registration event
        registration_data = {
            'action': 'participant_registered',
            'user': user,
            'role': role,
            'registered_at': datetime.now().isoformat()
        }
        
        # Add registration to blockchain
        blockchain.add_block(registration_data)
        log_event(registration_data)
        
        return jsonify({
            'msg': f'User {user} registered as {role}.',
            'participant': {'username': user, 'role': role},
            'total_participants': len(participants)
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/add-event', methods=['POST'])
def add_supply_chain_event():
    """
    Add a new supply chain event to the blockchain.
    
    Expected JSON payload:
    {
        "user": "participant_username",
        "action": "manufactured|shipped|received|delivered|quality_check|returned",
        "asset_id": "unique_asset_identifier",
        "meta": {
            "location": "current_location",
            "batch": "batch_number",
            "temperature": "storage_temperature",
            "notes": "additional_information"
        }
    }
    
    Returns:
        200: Success with block information
        400: Invalid input data
        403: Unauthorized user (not registered)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user = data.get('user', '').strip()
        action = data.get('action', '').strip()
        asset_id = data.get('asset_id', '').strip()
        meta = data.get('meta', {})
        
        # Validation
        if not user:
            return jsonify({'error': 'User is required'}), 400
        
        if not action:
            return jsonify({'error': 'Action is required'}), 400
        
        if not asset_id:
            return jsonify({'error': 'Asset ID is required'}), 400
        
        # Check if user is registered
        if user not in participants:
            return jsonify({
                'error': 'Unauthorized. Please register first.',
                'hint': 'Use /api/register endpoint to register as a participant'
            }), 403
        
        # Validate action
        valid_actions = [
            'manufactured', 'shipped', 'received', 'delivered', 
            'quality_check', 'returned', 'damaged', 'disposed'
        ]
        if action not in valid_actions:
            return jsonify({
                'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'
            }), 400
        
        # Prepare the event data for blockchain
        event_data = {
            'user': user,
            'role': participants[user],
            'action': action,
            'asset_id': asset_id,
            'meta': meta,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add to blockchain
        new_block = blockchain.add_block(event_data)
        
        # Update or create asset record
        if asset_id not in assets:
            assets[asset_id] = {
                'asset_id': asset_id,
                'name': meta.get('name', f'Asset {asset_id}'),
                'category': meta.get('category', 'General'),
                'batch': meta.get('batch', 'N/A'),
                'created_at': datetime.now().isoformat(),
                'created_by': user
            }
        
        # Update asset status and location
        assets[asset_id].update({
            'current_status': action,
            'current_location': meta.get('location', 'Unknown'),
            'last_updated': time.time(),
            'last_updated_by': user
        })
        
        # Log the event
        log_event(event_data)
        
        return jsonify({
            'msg': 'Event added successfully.',
            'block': {
                'index': new_block.index,
                'timestamp': new_block.timestamp,
                'hash': new_block.hash,
                'data': new_block.data
            },
            'asset_updated': assets[asset_id],
            'blockchain_length': len(blockchain.chain)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to add event: {str(e)}'}), 500

@app.route('/api/chain', methods=['GET'])
def get_blockchain():
    """
    Retrieve the complete blockchain.
    
    Returns:
        200: Complete blockchain as JSON array
        500: Server error
        
    The response includes all blocks with their:
    - Index, timestamp, hash, previous hash
    - Complete event data
    - Chain validation status
    """
    try:
        chain_data = blockchain.get_chain()
        
        return jsonify({
            'chain': chain_data,
            'length': len(chain_data),
            'is_valid': blockchain.validate_chain(),
            'latest_block_hash': blockchain.get_latest_block().hash
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve blockchain: {str(e)}'}), 500

@app.route('/api/participants', methods=['GET'])
def get_participants():
    """
    Get all registered participants.
    
    Returns:
        200: Dictionary mapping usernames to roles
        500: Server error
        
    Response format matches the original Flask app for compatibility.
    """
    try:
        return jsonify(participants)
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve participants: {str(e)}'}), 500

@app.route('/api/participants-list', methods=['GET'])
def get_participants_detailed():
    """
    Get detailed participant information including statistics.
    
    Returns:
        200: List of participants with detailed information
        500: Server error
    """
    try:
        participant_list = []
        
        for username, role in participants.items():
            # Count events by this participant
            participant_events = [
                event for event in events_history 
                if event.get('user') == username
            ]
            
            participant_info = {
                'id': f"participant_{username}",
                'username': username,
                'role': role,
                'status': 'active',  # In this simple implementation, all are active
                'eventCount': len(participant_events),
                'createdAt': participant_events[0]['timestamp'] if participant_events else datetime.now().isoformat()
            }
            participant_list.append(participant_info)
        
        return jsonify(participant_list)
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve participant details: {str(e)}'}), 500

@app.route('/api/participant-stats', methods=['GET'])
def get_participant_statistics():
    """
    Get participant statistics by role.
    
    Returns:
        200: Statistics object with counts by role
        500: Server error
    """
    try:
        stats = get_participant_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve participant stats: {str(e)}'}), 500

@app.route('/api/assets', methods=['GET'])
def get_all_assets():
    """
    Get all tracked assets.
    
    Query Parameters:
        status: Filter by asset status (optional)
        search: Search in asset ID or name (optional)
    
    Returns:
        200: List of all assets with their current status
        500: Server error
    """
    try:
        # Get query parameters
        status_filter = request.args.get('status')
        search_query = request.args.get('search', '').lower()
        
        asset_list = []
        
        for asset_id, asset_info in assets.items():
            # Apply status filter if provided
            if status_filter and asset_info.get('current_status') != status_filter:
                continue
            
            # Apply search filter if provided
            if search_query:
                searchable_text = f"{asset_id} {asset_info.get('name', '')}".lower()
                if search_query not in searchable_text:
                    continue
            
            asset_list.append(asset_info)
        
        # Sort by last updated (most recent first)
        asset_list.sort(key=lambda x: x.get('last_updated', 0), reverse=True)
        
        return jsonify({
            'assets': asset_list,
            'total_count': len(asset_list),
            'filtered': bool(status_filter or search_query)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve assets: {str(e)}'}), 500

@app.route('/api/assets/<asset_id>', methods=['GET'])
def get_asset_details(asset_id: str):
    """
    Get detailed information about a specific asset.
    
    Args:
        asset_id: The unique asset identifier
    
    Returns:
        200: Asset details with complete event history
        404: Asset not found
        500: Server error
    """
    try:
        if asset_id not in assets:
            return jsonify({'error': f'Asset {asset_id} not found'}), 404
        
        asset_info = assets[asset_id]
        
        # Get all events for this asset from the blockchain
        asset_events = []
        for block in blockchain.chain:
            if block.data.get('asset_id') == asset_id:
                asset_events.append({
                    'block_index': block.index,
                    'timestamp': block.timestamp,
                    'action': block.data.get('action'),
                    'user': block.data.get('user'),
                    'role': block.data.get('role'),
                    'location': block.data.get('meta', {}).get('location'),
                    'metadata': block.data.get('meta', {})
                })
        
        # Sort events by timestamp
        asset_events.sort(key=lambda x: x['timestamp'])
        
        return jsonify({
            'asset': asset_info,
            'events': asset_events,
            'event_count': len(asset_events),
            'current_block': blockchain.get_latest_block().index
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve asset details: {str(e)}'}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_statistics():
    """
    Get comprehensive dashboard statistics.
    
    Returns:
        200: Dashboard statistics including assets, events, participants
        500: Server error
    """
    try:
        # Asset statistics
        asset_stats = get_asset_statistics()
        
        # Participant statistics
        participant_stats = get_participant_stats()
        
        # Blockchain statistics
        chain_stats = {
            'total_blocks': len(blockchain.chain),
            'is_valid': blockchain.validate_chain(),
            'latest_block_index': blockchain.get_latest_block().index,
            'genesis_timestamp': blockchain.chain[0].timestamp if blockchain.chain else None
        }
        
        # Recent activity count (last 24 hours)
        current_time = time.time()
        recent_events = [
            event for event in events_history 
            if current_time - event.get('timestamp', 0) < 86400  # 24 hours
        ]
        
        dashboard_stats = {
            'totalAssets': asset_stats['total_assets'],
            'totalEvents': len(events_history),
            'activeParticipants': participant_stats['total'],
            'chainIntegrity': 100 if chain_stats['is_valid'] else 0,
            'recentActivity': len(recent_events),
            'blockchainLength': chain_stats['total_blocks'],
            'assetsByStatus': asset_stats['by_status'],
            'participantsByRole': {
                'manufacturers': participant_stats['manufacturers'],
                'shippers': participant_stats['shippers'],
                'retailers': participant_stats['retailers'],
                'other': participant_stats['other']
            }
        }
        
        return jsonify(dashboard_stats)
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve dashboard stats: {str(e)}'}), 500

@app.route('/api/recent-activities', methods=['GET'])
def get_recent_activities():
    """
    Get recent supply chain activities for dashboard display.
    
    Query Parameters:
        limit: Number of activities to return (default: 10, max: 50)
    
    Returns:
        200: List of recent activities with participant and asset details
        500: Server error
    """
    try:
        limit = min(int(request.args.get('limit', 10)), 50)
        
        # Get recent events from history
        recent_events = sorted(
            events_history, 
            key=lambda x: x.get('timestamp', ''), 
            reverse=True
        )[:limit]
        
        # Format for frontend display
        activities = []
        for event in recent_events:
            activity = {
                'id': f"event_{event.get('block_index', 0)}",
                'action': event.get('action', 'unknown').replace('_', ' ').title(),
                'participantName': event.get('user', 'Unknown'),
                'role': event.get('role', 'unknown'),
                'assetId': event.get('asset_id', 'Unknown'),
                'location': event.get('meta', {}).get('location', 'Unknown'),
                'timestamp': event.get('timestamp'),
                'metadata': event.get('meta', {})
            }
            activities.append(activity)
        
        return jsonify(activities)
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve recent activities: {str(e)}'}), 500

# ============================================================================
# HEALTH AND UTILITY ENDPOINTS
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring and deployment.
    
    Returns:
        200: System health information
    """
    return jsonify({
        'status': 'healthy',
        'blockchain_valid': blockchain.validate_chain(),
        'total_participants': len(participants),
        'total_assets': len(assets),
        'total_events': len(events_history),
        'blockchain_length': len(blockchain.chain),
        'server_time': datetime.now().isoformat()
    })

@app.route('/api/validate-chain', methods=['GET'])
def validate_blockchain():
    """
    Validate the entire blockchain integrity.
    
    Returns:
        200: Validation result with details
    """
    is_valid = blockchain.validate_chain()
    
    return jsonify({
        'is_valid': is_valid,
        'total_blocks': len(blockchain.chain),
        'validation_timestamp': datetime.now().isoformat(),
        'message': 'Blockchain is valid' if is_valid else 'Blockchain integrity compromised'
    })

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors with helpful API response."""
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested API endpoint does not exist',
        'available_endpoints': [
            '/api/register',
            '/api/add-event',
            '/api/chain',
            '/api/participants',
            '/api/assets',
            '/api/dashboard-stats',
            '/api/health'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors with helpful API response."""
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred on the server'
    }), 500

# ============================================================================
# CHATBOT FUNCTIONALITY
# ============================================================================

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    """
    Simple chatbot for OriginLedger support and asset tracking queries.
    
    Expected JSON payload:
    {
        "message": "user question or command"
    }
    
    Returns:
        200: Bot response with helpful information
        400: Invalid input
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_input = data.get('message', '').strip().lower()
        
        if not user_input:
            return jsonify({'error': 'Message is required'}), 400
        
        # Check for asset tracking queries
        if 'where' in user_input and 'asset' in user_input:
            # Try to extract asset_id using regex
            import re
            search = re.findall(r'[a-zA-Z]+-\d+-\d+|\d+', user_input)
            asset_id = search[0] if search else None
            
            if asset_id:
                # Check if asset exists in our assets registry
                if asset_id in assets:
                    asset_info = assets[asset_id]
                    current_status = asset_info.get('current_status', 'unknown')
                    current_location = asset_info.get('current_location', 'unknown')
                    
                    # Get recent events for this asset
                    recent_events = []
                    for block in blockchain.chain:
                        if block.data.get('asset_id') == asset_id:
                            recent_events.append({
                                'action': block.data.get('action'),
                                'user': block.data.get('user'),
                                'timestamp': datetime.fromtimestamp(block.timestamp).strftime('%Y-%m-%d %H:%M'),
                                'location': block.data.get('meta', {}).get('location', 'N/A')
                            })
                    
                    if recent_events:
                        latest_event = recent_events[-1]
                        return jsonify({
                            'reply': f"Asset {asset_id} is currently '{current_status}' at {current_location}. Latest event: {latest_event['action']} by {latest_event['user']} on {latest_event['timestamp']}.",
                            'asset_id': asset_id,
                            'status': current_status,
                            'location': current_location,
                            'events': recent_events
                        })
                    else:
                        return jsonify({
                            'reply': f"Asset {asset_id} found but no events recorded yet.",
                            'asset_id': asset_id
                        })
                else:
                    return jsonify({
                        'reply': f"Asset {asset_id} not found in the system. Please check the asset ID or register it first."
                    })
            else:
                return jsonify({
                    'reply': "I couldn't find an asset ID in your message. Please specify an asset ID like 'PRD-2024-001' or just numbers."
                })
        
        # Asset status queries
        elif 'status' in user_input and ('asset' in user_input or any(char.isdigit() for char in user_input)):
            import re
            search = re.findall(r'[a-zA-Z]+-\d+-\d+|\d+', user_input)
            asset_id = search[0] if search else None
            
            if asset_id and asset_id in assets:
                asset_info = assets[asset_id]
                return jsonify({
                    'reply': f"Asset {asset_id} status: {asset_info.get('current_status', 'unknown')} at {asset_info.get('current_location', 'unknown location')}. Last updated: {datetime.fromtimestamp(asset_info.get('last_updated', 0)).strftime('%Y-%m-%d %H:%M') if asset_info.get('last_updated') else 'never'}."
                })
        
        # Help and onboarding
        elif 'help' in user_input or 'how' in user_input:
            return jsonify({
                'reply': """I can help you with OriginLedger! Try asking:
• 'Where is asset PRD-2024-001?' - Track asset location and status
• 'Status of asset 12345' - Get current asset status
• 'How do I register?' - Learn about participant registration
• 'How do I add an event?' - Learn about recording supply chain events
• 'What participants are registered?' - See current participants"""
            })
        
        # Registration instructions
        elif 'register' in user_input or 'participant' in user_input:
            participant_count = len(participants)
            roles = ['manufacturer', 'shipper', 'retailer', 'other']
            return jsonify({
                'reply': f"To register as a participant, use the 'Add Participant' button in the Participants section. You can register as: {', '.join(roles)}. Currently {participant_count} participants are registered."
            })
        
        # Event adding instructions
        elif 'add' in user_input and ('event' in user_input or 'shipment' in user_input):
            return jsonify({
                'reply': "To add a supply chain event, go to the 'Add Event' section. You'll need: participant name, action type (manufactured, shipped, received, etc.), asset ID, and optional location/metadata. Events are automatically added to the blockchain."
            })
        
        # Participants query
        elif 'participants' in user_input and 'who' in user_input:
            if participants:
                participant_list = [f"{user} ({role})" for user, role in participants.items()]
                return jsonify({
                    'reply': f"Registered participants: {', '.join(participant_list[:5])}{'...' if len(participant_list) > 5 else ''}. Total: {len(participants)} participants."
                })
            else:
                return jsonify({
                    'reply': "No participants are currently registered. Use the 'Add Participant' button to register the first participant."
                })
        
        # Blockchain info
        elif 'blockchain' in user_input or 'blocks' in user_input:
            chain_length = len(blockchain.chain)
            is_valid = blockchain.validate_chain()
            return jsonify({
                'reply': f"OriginLedger blockchain has {chain_length} blocks and is {'valid' if is_valid else 'invalid'}. Total events recorded: {len(events_history)}."
            })
        
        # Greeting
        elif any(greeting in user_input for greeting in ['hello', 'hi', 'hey']):
            return jsonify({
                'reply': "Hello! I'm the OriginLedger assistant. I can help you track assets, understand how to use the platform, and answer questions about your supply chain. What would you like to know?"
            })
        
        # Default fallback
        else:
            return jsonify({
                'reply': "I didn't understand that question. Try asking about asset tracking ('Where is asset 12345?'), platform help ('How do I register?'), or say 'help' for more options."
            })
        
    except Exception as e:
        return jsonify({'error': f'Chatbot error: {str(e)}'}), 500

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    """
    Main application entry point.
    
    Configuration:
    - Host: 0.0.0.0 (accept connections from any IP)
    - Port: 8000 (backend port as per requirements)
    - Debug: True for development (disable in production)
    
    For production deployment:
    1. Set debug=False
    2. Use a production WSGI server like Gunicorn
    3. Implement proper database backend
    4. Add authentication and authorization
    5. Enable HTTPS
    """
    
    print("=" * 60)
    print("🔗 SUPPLY CHAIN BLOCKCHAIN API STARTING")
    print("=" * 60)
    print(f"📊 Dashboard: Visit the frontend at http://localhost:5000")
    print(f"🔌 API Base URL: http://0.0.0.0:8000/api")
    print(f"📚 Health Check: http://0.0.0.0:8000/api/health")
    print(f"⛓️  Blockchain Status: {blockchain.validate_chain()}")
    print("=" * 60)
    
    # Run the Flask development server
    app.run(
        host='0.0.0.0',    # Accept connections from any IP
        port=8000,         # Backend port
        debug=True,        # Enable debug mode for development
        threaded=True      # Handle multiple requests concurrently
    )
