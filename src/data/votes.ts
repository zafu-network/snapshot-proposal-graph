import { PAGE_SIZE, queryData } from "./snapshot";
import { SnapshotParticipant } from "./types";
import { getAddress } from "@ethersproject/address";

interface SnapshotHubVotes {
  votes: SnapshotHubVote[];
}

interface SnapshotHubVote {
  voter: string;
  choice: number;
  created: number;
  vp: number;
  vp_by_strategy: number[];
}

const VOTE_QUERY = `query Votes($id: String!, $first: Int, $skip: Int, $orderBy: String, $orderDirection: OrderDirection, $voter: String) {
    votes(
      first: $first
      skip: $skip
      where: {proposal: $id, vp_gt: 0, voter: $voter}
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      ipfs
      voter
      choice
      vp
      vp_by_strategy
      reason
      created
    }
  }`;

export const loadVotes = async (
  id: string
): Promise<Map<string, SnapshotParticipant>> => {
  const votes: Map<string, SnapshotParticipant> = new Map();
  var offset = 0;
  while (true) {
    const votesResp = (
      await queryData<SnapshotHubVotes>("Votes", VOTE_QUERY, {
        id,
        orderBy: "vp",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: offset,
      })
    ).votes;

    votesResp.forEach((vote) => {
      const voterAddress = getAddress(vote.voter);
      votes.set(voterAddress, {
        address: voterAddress,
        votingPower: vote.vp,
        choice: vote.choice,
        hasDelegates: vote.vp_by_strategy[1] > 0,
        created: vote.created
      });
    });

    if (votesResp.length != PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return votes;
};
