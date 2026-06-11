export type AuctionType = 'live' | 'simultaneous';
export type AuctionStatus = 'draft' | 'active' | 'closed';
export type LotStatus = 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled';

export interface Auction {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: AuctionType;
  status: AuctionStatus;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  streaming_url?: string | null;
  is_highlight?: boolean | null;
  image_url?: string | null;
  require_deposit?: boolean | null;
  deposit_amount?: number | null;
  commission_rate?: number | null;
  administrative_fee?: number | null;
  streaming_active?: boolean | null;
  streaming_playing?: boolean | null;
}

export interface Lot {
  id: string;
  auction_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  status: LotStatus;
  starting_price: number;
  current_highest_bid: number | null;
  lot_order: number | null;
  min_increment?: number | null;
  buyout_price?: number | null;
  active_until: string | null;
  gallery_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  hammer_enabled?: boolean | null;
  buyout_enabled?: boolean | null;
}

export interface Bid {
  id: string;
  lot_id: string;
  user_id: string;
  amount: number;
  is_automatic: boolean | null;
  bid_source?: string | null;
  manual_bidder_name?: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface LiveAuctionControl {
  id: string;
  auction_id: string;
  current_lot_id?: string;
  is_running: boolean;
  started_at?: string;
  current_lot_started_at?: string;
  lot_time_limit_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface AuctionWinner {
  id: string;
  lot_id: string;
  user_id: string;
  final_amount: number;
  bid_amount?: number | null;
  commission_amount?: number | null;
  administrative_amount?: number | null;
  escrow_status: string;
  created_at: string;
  updated_at: string;
}
