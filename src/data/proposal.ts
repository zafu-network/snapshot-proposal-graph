import { queryData } from "./snapshot"

interface SnapshotHubProposal {
  proposal: SnapshotProposal;
}


export interface SnapshotProposal {
    id: string
    title: string
    choices: string[]
    space: SnapshotSpace,
    start: number,
    end: number
}

export interface SnapshotSpace {
    id: string
}

const PROPOSAL_QUERY = `query Proposal($id: String!) {
    proposal(id: $id) {
        id
        ipfs
        title
        body
        discussion
        choices
        start
        end
        snapshot
        state
        author
        created
        plugins
        network
        type
        quorum
        symbol
        privacy
        strategies {
            name
            network
            params
        }
        space {
            id
            name
        }
        scores_state
        scores
        scores_by_strategy
        scores_total
        votes
    }
}
`

export const loadProposal = async(id: string): Promise<SnapshotProposal> => {
    return (
      await queryData<SnapshotHubProposal>("Proposal", PROPOSAL_QUERY, {
        id
      })
    ).proposal;
}