import { getAddress } from "@ethersproject/address";
import { PAGE_SIZE, queryData, SNAPSHOT_SUBGRAPH_MAINNET } from "./snapshot";
import { SnapshotDelegator, SnapshotParticipant } from "./types";

interface SnapshotSubgraphDelegations {
  delegations: SnapshotSubgraphDelegation[];
}

interface SnapshotSubgraphDelegation {
  delegator: string;
  delegate: string;
  space: string;
}

const DELEGATIONS_QUERY = `query Delegates($first: Int, $skip: Int, $delegates: [String], $spaces: [String]){ 
    delegations (
      first: $first
      skip: $skip
      where: {delegate_in: $delegates, space_in: $spaces}
    ) { 
      delegator 
      delegate
      space
    }
  }`;

const loadDelegatesBatch = async (
  delegates: string[],
  spaces: string[]
): Promise<SnapshotSubgraphDelegation[]> => {
  const delegations: SnapshotSubgraphDelegation[] = [];
  var offset = 0;
  while (true) {
    const delegatesResp = (
      await queryData<SnapshotSubgraphDelegations>(
        "Delegates",
        DELEGATIONS_QUERY,
        {
          delegates,
          spaces,
          first: PAGE_SIZE,
          skip: offset,
        },
        SNAPSHOT_SUBGRAPH_MAINNET
      )
    ).delegations;

    delegations.push(...delegatesResp);
    if (delegatesResp.length != PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return delegations;
};

const addDelegate = (
  delegates: Map<string, SnapshotDelegator[]>,
  vote: SnapshotParticipant | undefined,
  delegation: SnapshotSubgraphDelegation
) => {
  const delegateAddress = getAddress(delegation.delegate);
  if (!delegates.has(delegateAddress)) {
    delegates.set(delegateAddress, []);
  }
  const delegate = delegates.get(delegateAddress);
  delegate!!.push({
    address: vote?.address || getAddress(delegation.delegator),
    choice: vote?.choice || 0,
    votingPower: vote?.votingPower || 0,
    hasDelegates: vote?.hasDelegates || false,
    space: delegation.space,
    created: vote?.created || 0,
  });
};

const higherPriorityDelegation = (left: SnapshotSubgraphDelegation, right?: SnapshotSubgraphDelegation): SnapshotSubgraphDelegation => {
    if (!right) return left;
    // Naive assumption -> safe.eth > safe > ""
    if (left.space.length > right.space.length) return left
    return right
}

const loadDelegateChunk = async (
  chunk: string[],
  delegators: Map<string, SnapshotSubgraphDelegation>,
  spaces: string[]
) => {
  const delegations = await loadDelegatesBatch(chunk, spaces);
  delegations.forEach((delegation) => {
    const current = delegators.get(delegation.delegator)
    delegators.set(delegation.delegator, higherPriorityDelegation(delegation, current))
  });
};

export const loadDelegates = async (
  votes: Map<string, SnapshotParticipant>,
  space: string
): Promise<Map<string, SnapshotDelegator[]>> => {
  const delegators: Map<string, SnapshotSubgraphDelegation> = new Map();
  var currentChunk = [];
  const spaces = ["", space]
  if (space.endsWith(".eth")) {
    spaces.push(space.replace(".eth", ""))
  }

  for (const vote of votes.values()) {
    if (!vote.hasDelegates) continue;
    currentChunk.push(vote.address);

    if (currentChunk.length < 500) continue;

    console.log("Load Chunk");
    await loadDelegateChunk(currentChunk, delegators, spaces);
    currentChunk = [];
  }
  if (currentChunk.length > 0) {
    console.log("Load Last Chunk");
    await loadDelegateChunk(currentChunk, delegators, spaces);
  }
  const delegates: Map<string, SnapshotDelegator[]> = new Map();
  delegators.forEach((delegation) => {
    const vote = votes.get(getAddress(delegation.delegator));
    addDelegate(delegates, vote, delegation);
  });
  return delegates;
};
