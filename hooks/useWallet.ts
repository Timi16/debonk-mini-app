import { useState, useEffect } from 'react';

export interface WalletBalance {
  success: boolean;
  balance: number;
  decimals: number;
  raw: string;
  type: string;
  chain: string;
}

export interface Position {
  id: number;
  tokenAddress: string;
  tokenTicker: string;
  amountHeld: string;
  avgBuyPrice: string;
  chain: string;
  walletId: string;
  isSimulation: boolean;
  competitionId?: string;
  teamId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositionsResponse {
  success: boolean;
  positions: Position[];
  telegramId: string;
  userId: number;
}

// Hook to fetch wallet balance
export function useWalletBalance(telegramId: string, chain: string, tokenAddress?: string) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramId || !chain) {
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          telegramId,
          chain,
        });

        if (tokenAddress) {
          params.append('tokenAddress', tokenAddress);
        }

        const response = await fetch(`/api/wallet/balance?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch balance');
        }

        const data = await response.json();
        setBalance(data);
      } catch (err: any) {
        console.error('Error fetching balance:', err);
        setError(err.message);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [telegramId, chain, tokenAddress]);

  const refetch = () => {
    if (telegramId && chain) {
      setLoading(true);
      // Trigger re-fetch by changing a state
      const params = new URLSearchParams({
        telegramId,
        chain,
      });

      if (tokenAddress) {
        params.append('tokenAddress', tokenAddress);
      }

      fetch(`/api/wallet/balance?${params.toString()}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch balance');
          }
          return response.json();
        })
        .then(data => setBalance(data))
        .catch(err => {
          console.error('Error refetching balance:', err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  };

  return { balance, loading, error, refetch };
}

// Hook to fetch positions
export function usePositions(telegramId: string, chain?: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramId) {
      setLoading(false);
      return;
    }

    const fetchPositions = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          telegramId,
        });

        if (chain) {
          params.append('chain', chain);
        }

        const response = await fetch(`/api/positions?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch positions');
        }

        const data: PositionsResponse = await response.json();
        setPositions(data.positions || []);
      } catch (err: any) {
        console.error('Error fetching positions:', err);
        setError(err.message);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [telegramId, chain]);

  const refetch = () => {
    if (telegramId) {
      setLoading(true);
      const params = new URLSearchParams({
        telegramId,
      });

      if (chain) {
        params.append('chain', chain);
      }

      fetch(`/api/positions?${params.toString()}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch positions');
          }
          return response.json();
        })
        .then((data: PositionsResponse) => setPositions(data.positions || []))
        .catch(err => {
          console.error('Error refetching positions:', err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  };

  return { positions, loading, error, refetch };
}

// Hook to fetch wallet address
export function useWalletAddress(telegramId: string, chain: string) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramId || !chain) {
      setLoading(false);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          telegramId,
          chain,
        });

        const response = await fetch(`/api/wallet/address?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch wallet address');
        }

        const data = await response.json();
        setAddress(data.address);
      } catch (err: any) {
        console.error('Error fetching wallet address:', err);
        setError(err.message);
        setAddress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [telegramId, chain]);

  return { address, loading, error };
}

// Hook to fetch supported chains
export function useChains() {
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChains = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/chains');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch chains');
        }

        const data = await response.json();
        setChains(data.chains || []);
      } catch (err: any) {
        console.error('Error fetching chains:', err);
        setError(err.message);
        setChains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChains();
  }, []);

  return { chains, loading, error };
}