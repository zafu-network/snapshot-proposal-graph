import Sigma from "sigma";
import Graph from "graphology";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";

import NodeProgramBorder from "../renderer/node.border";
import { SnapshotDelegator, SnapshotParticipant } from "../data/types";
import { loadVotes } from "../data/votes";
import { loadDelegates } from "../data/delegates";
import { PathHighligher } from "../ui/highlighter";
import { buildDelegatorLabel, buildParticipantLabel } from "../ui/labels";
import { loadProposal } from "../data/proposal";

const addParticipantToGraph = (
  graph: Graph,
  participant: SnapshotParticipant,
  label: string = buildParticipantLabel(participant)
) => {
  if (graph.hasNode(participant.address)) return;
  graph.addNode(participant.address, {
    type: "border",
    nodeType: "participant",
    label,
    participant
  });
};

const nodeColor = (choice: number, hasDelegates: boolean): string => {
  switch (choice) {
    case 1:
      return "#7C4DFF"; // hasDelegates ? "#7B1FA2" : "#7C4DFF";
    case 2:
      return "#00BCD4"; // hasDelegates ? "#00796B" : "#00BCD4";
    default:
      return "#9E9E9E"; // hasDelegates ? "#455A64" : "#9E9E9E";
  }
};

const setLoadingStatus = async (status: string) => {
  const loadingStatus = document.getElementById(
    "loading-status"
  ) as HTMLElement;
  console.log({ loadingStatus }, status);
  loadingStatus.textContent = status;
};

export const buildGraph = async (proposalId: string) => {
  if (proposalId.length < 64) throw Error("Unexpected proposal id")
  setLoadingStatus("Initializing");
  const graph: Graph = new Graph();
  const proposal = await loadProposal(proposalId)
  graph.addNode(proposalId, {
    nodeType: "proposal",
    label: "Proposal",
    proposal
  });
  setLoadingStatus("Loading Votes");
  const votes = await loadVotes(proposalId);
  setLoadingStatus("Loading Delegates");
  const delegates = await loadDelegates(votes, proposal.space.id);

  setLoadingStatus("Build Graph");
  votes.forEach((participant) => {
    addParticipantToGraph(graph, participant);
    graph.addEdge(proposalId, participant.address, { weight: 1 });
  });

  delegates.forEach((delegators: SnapshotDelegator[], delegate: string) => {
    delegators.forEach((delegator: SnapshotDelegator) => {
      addParticipantToGraph(graph, delegator, buildDelegatorLabel(delegator));
      if (graph.hasEdge(proposalId, delegator.address))
        graph.dropEdge(proposalId, delegator.address);
      graph.addEdge(delegate, delegator.address, { weight: 1 });
    });
  });

  graph.forEachNode((node, attributes) => {
    if (attributes.nodeType !== "participant") return;
    const hasDelegates = attributes.participant.hasDelegates;
    const choice = attributes.participant.choice;
    graph.setNodeAttribute(node, "color", nodeColor(choice, hasDelegates));
  });

  const votingPowers = Array.from(votes.values()).map(
    (vote) => vote.votingPower
  );
  const minVotingPower = Math.min(...votingPowers);
  const maxVotingPower = Math.max(...votingPowers);
  const minSize = 2;
  const maxSize = 40;
  graph.forEachNode((node, attributes) => {
    if (attributes.nodeType === "participant") {
      const vp = attributes.participant.votingPower;
      graph.setNodeAttribute(
        node,
        "size",
        minSize +
          ((vp - minVotingPower) / (maxVotingPower - minVotingPower)) *
            (maxSize - minSize)
      );
    } else if (attributes.nodeType === "proposal") {
      graph.setNodeAttribute(
        node,
        "size",
        10
      );
    };
  });

  setLoadingStatus("Prepare Layout");
  circular.assign(graph);
  const settings = forceAtlas2.inferSettings(graph);
  setLoadingStatus("Layout Graph");
  forceAtlas2.assign(graph, { settings, iterations: 200 });

  const loader = document.getElementById("loading-container") as HTMLElement;
  loader.style.display = "none";

  setLoadingStatus("Render Graph");
  const sigmaContainer = document.getElementById("sigma-container") as HTMLElement;
  const sigma = new Sigma(graph, sigmaContainer, {
    nodeProgramClasses: {
      border: NodeProgramBorder,
    },
    renderEdgeLabels: true,
  });
  const detailsContainer = document.getElementById("details-container") as HTMLElement;
  new PathHighligher(sigma, graph, detailsContainer, proposal)
};