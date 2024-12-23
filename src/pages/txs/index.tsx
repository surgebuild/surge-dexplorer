/* eslint-disable prettier/prettier */
import { InfoOutlineIcon } from '@chakra-ui/icons'
import {
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Skeleton,
  Tooltip,
  VStack,
} from '@chakra-ui/react'
import { toHex } from '@cosmjs/encoding'
import { StatusResponse, TxEvent } from '@cosmjs/tendermint-rpc'
import { TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { BoxInfo } from '@/components/shared/BoxInfo'
import GradientBackground from '@/components/shared/GradientBackground'
import TransactionList from '@/components/TransactionList'
import { getLatestTxs, getTxsByRestApi, getTxTimeStamp } from '@/rpc/query'
import { selectNewBlock, selectTxEvent } from '@/store/streamSlice'
import {
  extractSenderAndRecipient,
  normalizeToISOString,
  sanitizeString,
} from '@/utils'

const MAX_ROWS = 100

interface Tx {
  hash: any
  TxEvent: TxEvent
  Timestamp: string
  height: number
  fromAddress: string
  toAddress: string
  txType: string
}

export default function Transactions() {
  const txEvent = useSelector(selectTxEvent)
  const [isLoaded, setIsLoaded] = useState(false)
  const newBlock = useSelector(selectNewBlock)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<StatusResponse | null>()
  const [txs, setTxs] = useState<Tx[]>([])
  const [totalTxs, setTotalTxs] = useState(0)
  const [loadingTx, setLoadingTx] = useState(false)

  // useEffect(() => {
  //   const fetchTransactions = async () => {
  //     const restEndpoint = 'https://rpc.devnet.surge.dev'
  //     const searchParams = {
  //       query: `"tx.height>0"`,
  //       per_page: '20',
  //       page: `${page}`,
  //       order_by: `"desc"`,
  //     }

  //     try {
  //       setLoadingTx(true)
  //       const { txData, txsCount } = await getTxsByRestApi(
  //         restEndpoint,
  //         searchParams
  //       )
  //       const formattedTxs = await Promise.all(
  //         txData.map(async (tx: any) => {
  //           const timestamp = await getTxTimeStamp(tx.height) // Resolve each timestamp
  //           return {
  //             hash: tx.hash,
  //             height: tx.height,
  //             Timestamp: timestamp, // Use resolved timestamp here
  //             status: tx.tx_result.code,
  //             fromAddress: '',
  //             toAddress: '',
  //           }
  //         })
  //       )
  //       // setApiTxs(formattedTxs)
  //       setLoadingTx(false)
  //       setTxs(formattedTxs)
  //       setTotalTxs(txsCount)
  //     } catch (error) {
  //       setLoadingTx(false)
  //       console.error('Error fetching transactions from REST API:', error)
  //     }
  //   }

  //   fetchTransactions()
  // }, [page])

  useEffect(() => {
    const fetchTransactions = async () => {
      const restEndpoint =
        process.env.NEXT_PUBLIC_RPC_ADDRESS || 'https://alphatestnet.surge.dev'
      const searchParams = {
        order: 'timestamp.desc',
        limit: 100,
      }
      const searchParams_restapi = {
        query: `"tx.height>0"`,
        per_page: '10',
        page: `${page}`,
        order_by: `"desc"`,
      }
      try {
        const { txData } = await getLatestTxs(searchParams)
        const { txsCount } = await getTxsByRestApi(
          restEndpoint,
          searchParams_restapi
        )
        setLoadingTx(true)
        const formattedTxs = await Promise.all(
          txData.map(async (tx: any) => {
            return {
              hash: tx.hash,
              height: tx.height,
              Timestamp: normalizeToISOString(tx.timestamp), // Use resolved timestamp here
              status: 0, //need to update
              fromAddress: tx.sender,
              toAddress: tx.receiver,
              txType: tx.method_name,
            }
          })
        )
        setLoadingTx(false)
        setTxs(formattedTxs)
        setTotalTxs(txsCount)
      } catch (error) {
        setLoadingTx(false)
        console.error('Error fetching transactions from REST API:', error)
      }
    }
    fetchTransactions()
  }, [])

  const updateTxs = (txEvent: TxEvent) => {
    if (!txEvent.result.data) {
      return
    }
    const data = TxBody.decode(txEvent.result.data)
    const result = extractSenderAndRecipient(txEvent)
    const tx = {
      TxEvent: txEvent,
      Timestamp: new Date().toISOString(),
      data: data,
      height: txEvent.height,
      hash: toHex(txEvent.hash).toUpperCase(),
      status: txEvent.result.code,
      fromAddress: result?.sender ?? '',
      toAddress: result?.recipient ?? '',
      txType: data.memo,
    }
    if (txs.length) {
      if (txEvent.height >= txs[0].height && txEvent.hash != txs[0].hash) {
        const updatedTx = [tx, ...txs.slice(0, MAX_ROWS - 1)].filter(
          (transaction, index, self) =>
            index ===
            self.findIndex((transx) => transx.hash === transaction.hash)
        )
        setTxs(updatedTx)
      }
    } else {
      setTxs([tx])
    }
  }

  useEffect(() => {
    if ((!isLoaded && newBlock) || (!isLoaded && status)) {
      setIsLoaded(true)
    }
  }, [isLoaded, newBlock, status])

  useEffect(() => {
    if (txEvent) {
      updateTxs(txEvent)
    }
  }, [txEvent])

  return (
    <>
      <Head>
        <title>Transactions | Surge Devnet Explorer</title>
        <meta
          name="description"
          content="Explore the Surge Devnet blockchain with ease. Access real-time data, transactions, and blockchain analytics."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          property="og:image"
          content="https://surge.sfo3.cdn.digitaloceanspaces.com/assets/surgeExplorer/surge_explorer_meta.png"
        />
        <meta
          property="twitter:image"
          content="https://surge.sfo3.cdn.digitaloceanspaces.com/assets/surgeExplorer/surge_explorer_meta.png"
        />
      </Head>
      <GradientBackground title="Transactions">
        <main>
          <Grid templateColumns="repeat(12, 1fr)" gap={5} mb={9}>
            <GridItem
              colSpan={{ base: 12, md: 4 }}
              display={'flex'}
              flexDirection={{ base: 'row', md: 'row' }}
              gap={5}
            >
              <Skeleton
                isLoaded={isLoaded}
                width={{ base: '50%', md: '100%' }}
                rounded={'12px'}
              >
                <BoxInfo
                  bgColor="green.200"
                  color="green.600"
                  name="TOTAL TXNS"
                  value={`#${totalTxs ?? '-'}`}
                  tooltipText="The total number of transactions processed on the Surge Devnet, including all transfers, inscriptions, and other activities."
                />
              </Skeleton>
              {/* <Skeleton isLoaded={isLoaded} width={{ base: '50%', md: '100%' }}>
                <BoxInfo
                  name="MAX TPS"
                  value={'-'}
                  tooltipText="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat"
                />
              </Skeleton> */}
            </GridItem>
            {/* <GridItem colSpan={{ base: 12, md: 9 }}>
              <Box>
                <VStack
                  bg={'gray-1000'}
                  borderRadius={12}
                  p={4}
                  pb={2}
                  border={'1px'}
                  h={'220px'}
                  borderColor={'gray-900'}
                  align={'flex-start'}
                >
                  <HStack mb={'14px'}>
                    <Heading size={'xs'} color={'gray-500'} fontWeight={500}>
                      Transactions
                    </Heading>
                    <Tooltip
                      label={'tooltip text'}
                      placement="right"
                      bg="gray.300"
                      color="black"
                    >
                      <Icon as={InfoOutlineIcon} w={'13px'} color="gray-500" />
                    </Tooltip>
                  </HStack>

                  <TransactionsChart />
                </VStack>
              </Box>
            </GridItem> */}
          </Grid>
          <TransactionList
            title="All Transactions"
            showAll={true}
            txs={txs?.length ? txs : []}
            totalTxs={totalTxs}
            // page={page}
            // setPage={setPage}
            loading={loadingTx}
          />
        </main>
      </GradientBackground>
    </>
  )
}
