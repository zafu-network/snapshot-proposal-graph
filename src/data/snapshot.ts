import axios from "axios";

export const PAGE_SIZE = 500;
export const SNAPSHOT_HUB = "https://hub.snapshot.org/graphql";
export const SNAPSHOT_SUBGRAPH_MAINNET =
  "https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot";

export const queryData = async <T>(
  operationName: string,
  query: string,
  variables: Record<string, any>,
  endpoint: string = SNAPSHOT_HUB
): Promise<T> => {
  const resp = await axios.post(endpoint, {
    operationName,
    variables,
    query,
  });
  if (resp.status != 200) throw Error(`Could not query hub: ${resp.status}`);
  if (!resp.data) throw Error(`Did not receive any data`);
  return resp.data.data;
};
