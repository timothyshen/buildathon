/**
 * Dune Analytics API Client
 * For fetching on-chain metrics for Story Protocol contracts
 */

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_API_BASE = "https://api.dune.com/api/v1";

export interface DuneExecutionResponse {
  execution_id: string;
  state: string;
}

export interface DuneResultResponse {
  execution_id: string;
  state: "QUERY_STATE_COMPLETED" | "QUERY_STATE_EXECUTING" | "QUERY_STATE_PENDING" | "QUERY_STATE_FAILED";
  result?: {
    rows: Record<string, unknown>[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
    };
  };
  error?: string;
}

export interface OnChainMetrics {
  contractAddress: string;
  // Transaction metrics
  dailyTxCount: number;
  weeklyTxCount: number;
  totalTxCount: number;
  // Volume metrics (in native token)
  dailyVolume: string;
  weeklyVolume: string;
  totalVolume: string;
  // User metrics
  dailyActiveAddresses: number;
  weeklyActiveAddresses: number;
  totalUniqueAddresses: number;
  // Timestamps
  firstTxAt: Date | null;
  lastTxAt: Date | null;
}

/**
 * Execute a Dune query with parameters
 */
async function executeQuery(
  queryId: number,
  params?: Record<string, string>
): Promise<string> {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY not configured");
  }

  const response = await fetch(`${DUNE_API_BASE}/query/${queryId}/execute`, {
    method: "POST",
    headers: {
      "X-Dune-API-Key": DUNE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query_parameters: params || {},
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dune execute failed: ${error}`);
  }

  const data: DuneExecutionResponse = await response.json();
  return data.execution_id;
}

/**
 * Get results of a query execution
 */
async function getExecutionResult(executionId: string): Promise<DuneResultResponse> {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY not configured");
  }

  const response = await fetch(`${DUNE_API_BASE}/execution/${executionId}/results`, {
    headers: {
      "X-Dune-API-Key": DUNE_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dune results failed: ${error}`);
  }

  return response.json();
}

/**
 * Poll for query completion with timeout
 */
async function waitForCompletion(
  executionId: string,
  maxWaitMs: number = 60000,
  pollIntervalMs: number = 2000
): Promise<DuneResultResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getExecutionResult(executionId);

    if (result.state === "QUERY_STATE_COMPLETED") {
      return result;
    }

    if (result.state === "QUERY_STATE_FAILED") {
      throw new Error(`Dune query failed: ${result.error || "Unknown error"}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Dune query timed out");
}

/**
 * Execute a query and wait for results
 */
export async function runQuery(
  queryId: number,
  params?: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const executionId = await executeQuery(queryId, params);
  const result = await waitForCompletion(executionId);

  if (!result.result?.rows) {
    return [];
  }

  return result.result.rows;
}

/**
 * Get the latest cached results for a query (faster, no execution)
 */
export async function getLatestResults(queryId: number): Promise<Record<string, unknown>[]> {
  if (!DUNE_API_KEY) {
    throw new Error("DUNE_API_KEY not configured");
  }

  const response = await fetch(`${DUNE_API_BASE}/query/${queryId}/results`, {
    headers: {
      "X-Dune-API-Key": DUNE_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dune latest results failed: ${error}`);
  }

  const data: DuneResultResponse = await response.json();
  return data.result?.rows || [];
}

/**
 * Fetch on-chain metrics for a contract address
 * Uses parameterized query to get metrics for any contract
 */
export async function fetchContractMetrics(
  contractAddress: string,
  queryId?: number
): Promise<OnChainMetrics> {
  // Use provided query ID or default from env
  // You'll need to create this query in Dune and get the ID
  const envQueryId = process.env.DUNE_METRICS_QUERY_ID;
  const METRICS_QUERY_ID = queryId || (envQueryId ? parseInt(envQueryId) : null);

  if (!METRICS_QUERY_ID) {
    throw new Error("DUNE_METRICS_QUERY_ID not configured - set the environment variable or pass queryId");
  }

  const rows = await runQuery(METRICS_QUERY_ID, {
    contract_address: contractAddress.toLowerCase(),
  });

  if (rows.length === 0) {
    // Return empty metrics if no data
    return {
      contractAddress,
      dailyTxCount: 0,
      weeklyTxCount: 0,
      totalTxCount: 0,
      dailyVolume: "0",
      weeklyVolume: "0",
      totalVolume: "0",
      dailyActiveAddresses: 0,
      weeklyActiveAddresses: 0,
      totalUniqueAddresses: 0,
      firstTxAt: null,
      lastTxAt: null,
    };
  }

  const row = rows[0];

  return {
    contractAddress,
    dailyTxCount: Number(row.daily_tx_count || 0),
    weeklyTxCount: Number(row.weekly_tx_count || 0),
    totalTxCount: Number(row.total_tx_count || 0),
    dailyVolume: String(row.daily_volume || "0"),
    weeklyVolume: String(row.weekly_volume || "0"),
    totalVolume: String(row.total_volume || "0"),
    dailyActiveAddresses: Number(row.daily_active_addresses || 0),
    weeklyActiveAddresses: Number(row.weekly_active_addresses || 0),
    totalUniqueAddresses: Number(row.total_unique_addresses || 0),
    firstTxAt: row.first_tx_at ? new Date(row.first_tx_at as string) : null,
    lastTxAt: row.last_tx_at ? new Date(row.last_tx_at as string) : null,
  };
}

/**
 * Verify a contract exists on Story Protocol
 */
export async function verifyContract(contractAddress: string): Promise<boolean> {
  // Use a simple query to check if contract has any transactions
  const envVerifyId = process.env.DUNE_VERIFY_QUERY_ID;
  const VERIFY_QUERY_ID = envVerifyId ? parseInt(envVerifyId) : null;

  if (!VERIFY_QUERY_ID) {
    // If no verify query configured, assume valid
    console.warn("DUNE_VERIFY_QUERY_ID not configured, skipping verification");
    return true;
  }

  try {
    const rows = await runQuery(VERIFY_QUERY_ID, {
      contract_address: contractAddress.toLowerCase(),
    });

    return rows.length > 0 && Number(rows[0].tx_count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Example Dune SQL query for contract metrics:
 *
 * -- Query ID: Create this in Dune and set DUNE_METRICS_QUERY_ID
 * -- Parameters: {{contract_address}}
 *
 * WITH contract_txs AS (
 *   SELECT *
 *   FROM story.transactions
 *   WHERE "to" = {{contract_address}}
 *      OR "from" = {{contract_address}}
 * ),
 * daily_stats AS (
 *   SELECT
 *     COUNT(*) as daily_tx_count,
 *     COUNT(DISTINCT "from") as daily_active_addresses,
 *     SUM(value) as daily_volume
 *   FROM contract_txs
 *   WHERE block_time >= NOW() - INTERVAL '1 day'
 * ),
 * weekly_stats AS (
 *   SELECT
 *     COUNT(*) as weekly_tx_count,
 *     COUNT(DISTINCT "from") as weekly_active_addresses,
 *     SUM(value) as weekly_volume
 *   FROM contract_txs
 *   WHERE block_time >= NOW() - INTERVAL '7 days'
 * ),
 * total_stats AS (
 *   SELECT
 *     COUNT(*) as total_tx_count,
 *     COUNT(DISTINCT "from") as total_unique_addresses,
 *     SUM(value) as total_volume,
 *     MIN(block_time) as first_tx_at,
 *     MAX(block_time) as last_tx_at
 *   FROM contract_txs
 * )
 * SELECT
 *   d.daily_tx_count,
 *   d.daily_active_addresses,
 *   d.daily_volume,
 *   w.weekly_tx_count,
 *   w.weekly_active_addresses,
 *   w.weekly_volume,
 *   t.total_tx_count,
 *   t.total_unique_addresses,
 *   t.total_volume,
 *   t.first_tx_at,
 *   t.last_tx_at
 * FROM daily_stats d, weekly_stats w, total_stats t
 */
