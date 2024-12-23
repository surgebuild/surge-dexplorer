import {
  Account,
  Block,
  Coin,
  IndexedTx,
  StargateClient,
} from '@cosmjs/stargate'
import {
  Tendermint37Client,
  TxSearchResponse,
  ValidatorsResponse,
} from '@cosmjs/tendermint-rpc'

export async function getChainId(
  tmClient: Tendermint37Client
): Promise<string> {
  const client = await StargateClient.create(tmClient)
  return client.getChainId()
}

export async function getValidators(
  tmClient: Tendermint37Client
): Promise<ValidatorsResponse> {
  return tmClient.validatorsAll()
}

export async function getBlock(
  tmClient: Tendermint37Client,
  height: number
): Promise<Block> {
  const client = await StargateClient.create(tmClient)
  return client.getBlock(height)
}

export async function getTx(
  tmClient: Tendermint37Client,
  hash: string
): Promise<IndexedTx | null> {
  const client = await StargateClient.create(tmClient)
  return client.getTx(hash)
}

export async function getAccount(
  tmClient: Tendermint37Client,
  address: string
): Promise<Account | null> {
  const client = await StargateClient.create(tmClient)
  return client.getAccount(address)
}

export async function getAllBalances(
  tmClient: Tendermint37Client,
  address: string
): Promise<readonly Coin[]> {
  const client = await StargateClient.create(tmClient)
  return client.getAllBalances(address)
}

export async function getBalanceStaked(
  tmClient: Tendermint37Client,
  address: string
): Promise<Coin | null> {
  const client = await StargateClient.create(tmClient)
  return client.getBalanceStaked(address)
}

export async function getTxsBySender(
  tmClient: Tendermint37Client,
  address: string,
  page: number,
  perPage: number
): Promise<TxSearchResponse> {
  return tmClient.txSearch({
    query: `message.sender='${address}'`,
    prove: true,
    order_by: 'desc',
    page: page,
    per_page: perPage,
  })
}

export async function getTotalInscriptions() {
  try {
    const response = await fetch(
      'https://api-alphatestnet.surge.dev/surge/proofstore/bitcoindata?pagination.reverse=true'
    )

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching bitcoindata:', error)
    return 0
  }
}

export async function getTxsByRestApi(restEndpoint: string, searchParams: any) {
  try {
    const response = await fetch(
      `${restEndpoint}/tx_search?${new URLSearchParams(searchParams)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      txData: data.result ? data.result.txs : [],
      txsCount: data.result ? data.result.total_count : 0,
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { txData: [], txsCount: 0 }
  }
}
export async function getLatestTxs(searchParams: any) {
  try {
    const response = await fetch(
      `https://index.devnet.surge.dev/transactions?${new URLSearchParams(
        searchParams
      )}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-cache',
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      txData: data,
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { txData: [] }
  }
}
export async function getBlocksByRestApi(
  restEndpoint: string,
  searchParams: any
) {
  try {
    const response = await fetch(
      `${restEndpoint}/block_search?${new URLSearchParams(searchParams)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      blocksData: data.result ? data.result.blocks : [],
      blocksCount: data.result ? data.result.total_count : 0,
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { blocksData: [], blocksCount: 0 }
  }
}

export async function getLatestBlocks() {
  try {
    const response = await fetch(`https://alphatestnet.surge.dev/blockchain`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      blocksData: data.result ? data.result.block_metas : [],
      blocksCount: data.result ? Number(data.result.last_height) : 0,
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { blocksData: [], blocksCount: 0 }
  }
}

export async function getBlockDetails(restEndpoint: string, height: string) {
  try {
    const response = await fetch(`${restEndpoint}/block?height=${height}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data.result?.block ?? null
  } catch (error) {
    console.error('Error fetching block details:', error)
    return null
  }
}

//getting individual timestamp for each transaction
export const getTxTimeStamp = async (blockHeight: string) => {
  try {
    const blockDetail = await getBlockDetails(
      'https://alphatestnet.surge.dev',
      blockHeight
    )

    if (!blockDetail || !blockDetail.header) {
      throw new Error('Invalid block details received.')
    }
    return blockDetail.header.time
  } catch (error) {
    console.error('Error fetching block details in txTimeStamp:', error)
    throw error
  }
}

export async function getBlocksFromRange(
  tmClient: Tendermint37Client,
  startBlock: number,
  endBlock: number
): Promise<{ firstBlocks: Block[]; lastBlock: Block }> {
  const client = await StargateClient.create(tmClient)

  try {
    // Get first three blocks from the range
    const firstBlocks = await Promise.all([
      client.getBlock(startBlock),
      client.getBlock(startBlock + 1),
      client.getBlock(startBlock + 2),
    ])

    // Get the last block
    const lastBlock = await client.getBlock(endBlock)

    return {
      firstBlocks,
      lastBlock,
    }
  } catch (error) {
    console.error('Error fetching blocks:', error)
    throw error
  }
}
