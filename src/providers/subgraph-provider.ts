import Logger from 'bunyan';
import { request, gql } from 'graphql-request';

export type SubgraphPool = {
  id: string;
  feeTier: string;
  liquidity: string;
  token0: {
    symbol: string;
  };
  token1: {
    symbol: string;
  };
  totalValueLockedETH: string;
};

export const printSubgraphPool = (s: SubgraphPool) =>
  `${s.token0.symbol}/${s.token1.symbol}/${s.feeTier}`;

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

const PAGE_SIZE = 3000;

export class SubgraphProvider {
  constructor(private log: Logger) {}

  public async getPools(): Promise<SubgraphPool[]> {
    // orderBy: totalValueLockedETH
    // orderDirection: desc
    const query = gql`
      query getPools($pageSize: Int!, $skip: Int!) {
        pools(first: $pageSize, skip: $skip) {
          id
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          feeTier
          liquidity
          totalValueLockedETH
        }
      }
    `;

    let skip = 0;
    let pools: SubgraphPool[] = [];
    let poolsPage: SubgraphPool[] = [];
    this.log.info(
      `Getting pools from the subgraph with page size ${PAGE_SIZE}.`
    );
    do {
      const poolsResult = await request<{ pools: SubgraphPool[] }>(
        SUBGRAPH_URL,
        query,
        {
          pageSize: PAGE_SIZE,
          skip,
        }
      );

      poolsPage = poolsResult.pools;

      pools = pools.concat(poolsPage);
      skip = skip + PAGE_SIZE;
    } while (poolsPage.length > 0);

    this.log.info(`Got ${pools.length} pools from the subgraph.`);

    return pools;
  }
}