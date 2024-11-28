import {
  Badge,
  Box,
  Divider,
  Heading,
  HStack,
  Icon,
  Link,
  Tag,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { createColumnHelper } from '@tanstack/react-table'
import Head from 'next/head'
import NextLink from 'next/link'
import { useEffect, useState } from 'react'
import { FiChevronRight, FiHome } from 'react-icons/fi'
import { useSelector } from 'react-redux'

import DataTable from '@/components/Datatable'
import { queryProposals } from '@/rpc/abci'
import { selectTmClient } from '@/store/connectSlice'
import { proposalStatus, proposalStatusList } from '@/utils/constant'
import { displayDate, getTypeMsg } from '@/utils/helper'

type Proposal = {
  id: bigint
  title: string
  types: string
  status: proposalStatus | undefined
  votingEnd: string
}

const columnHelper = createColumnHelper<Proposal>()

const columns = [
  columnHelper.accessor('id', {
    cell: (info) => `#${info.getValue()}`,
    header: '#ID',
  }),
  columnHelper.accessor('title', {
    cell: (info) => info.getValue(),
    header: 'Title',
  }),
  columnHelper.accessor('types', {
    cell: (info) => <Tag colorScheme="cyan">{info.getValue()}</Tag>,
    header: 'Types',
  }),
  columnHelper.accessor('status', {
    cell: (info) => {
      const value = info.getValue()
      if (!value) {
        return ''
      }
      return <Badge colorScheme={value.color}>{value.status}</Badge>
    },
    header: 'Status',
  }),
  columnHelper.accessor('votingEnd', {
    cell: (info) => info.getValue(),
    header: 'Voting End',
  }),
]

export default function Proposals() {
  const tmClient = useSelector(selectTmClient)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (tmClient) {
      setIsLoading(true)
      queryProposals(tmClient, page, perPage)
        .then((response) => {
          setTotal(Number(response.pagination?.total))
          const proposalsList: Proposal[] = response.proposals.map((val) => {
            const votingEnd = val.votingEndTime?.nanos
              ? new Date(
                  Number(val.votingEndTime?.seconds) * 1000
                ).toISOString()
              : null
            return {
              id: val.id,
              title: val.title,
              types: getTypeMsg(
                val.messages.length ? val.messages[0].typeUrl : ''
              ),
              status: proposalStatusList.find(
                (item) => item.id === Number(val.status.toString())
              ),
              votingEnd: votingEnd ? displayDate(votingEnd) : '',
            }
          })
          setProposals(proposalsList)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Failed to fetch proposals',
            description: '',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        })
    }
  }, [tmClient, page, perPage])

  const onChangePagination = (value: {
    pageIndex: number
    pageSize: number
  }) => {
    setPage(value.pageIndex)
    setPerPage(value.pageSize)
  }

  return (
    <>
      <Head>
        <title>Proposals | Surge Devnet Explorer</title>
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
      <main>
        <HStack h="24px">
          <Heading size={'md'}>Proposals</Heading>
          <Divider borderColor={'gray'} size="10px" orientation="vertical" />
          <Link
            as={NextLink}
            href={'/'}
            style={{ textDecoration: 'none' }}
            _focus={{ boxShadow: 'none' }}
            display="flex"
            justifyContent="center"
          >
            <Icon
              fontSize="16"
              color={useColorModeValue('light-theme', 'dark-theme')}
              as={FiHome}
            />
          </Link>
          <Icon fontSize="16" as={FiChevronRight} />
          <Text>Proposals</Text>
        </HStack>
        <Box
          mt={8}
          bg={useColorModeValue('light-container', 'dark-container')}
          shadow={'base'}
          borderRadius={4}
          p={4}
        >
          <DataTable
            columns={columns}
            data={proposals}
            total={total}
            isLoading={isLoading}
            onChangePagination={onChangePagination}
          />
        </Box>
      </main>
    </>
  )
}
