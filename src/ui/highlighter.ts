import Graph from "graphology";
import Sigma from "sigma";
import { SnapshotProposal } from "../data/proposal";
import { SnapshotParticipant } from "../data/types";

export class PathHighligher {
  highlightedNodes: string[] = [];
  highlightedEdges: string[] = [];
  graph: Graph;
  detailsContainer: HTMLElement;
  proposal?: SnapshotProposal;

  constructor(
    sigma: Sigma,
    graph: Graph,
    detailsContainer: HTMLElement,
    proposal?: SnapshotProposal
  ) {
    this.graph = graph;
    this.detailsContainer = detailsContainer;
    this.proposal = proposal;
    if (this.proposal) this.showProposalDetails(this.proposal);
    sigma.on("enterNode", (payload) => { this.handleSelectNode(payload.node) });
    sigma.on("clickNode", (payload) => { this.handleSelectNode(payload.node) })
    sigma.on("leaveNode", () => {
      if (this.proposal) this.showProposalDetails(this.proposal);
      else this.hideDetails();
      this.resetHighlightedEdges();
      this.resetHighlightedNodes();
    });
  }

  handleSelectNode(node: string) {
    const attributes = this.graph.getNodeAttributes(node);
      switch (attributes.nodeType) {
        case "participant": {
          this.handleHoverParticipantNode(node);
          break;
        }
        case "proposal": {
          this.handleHoverProposalNode(node);
          break;
        }
      }
  }

  handleHoverProposalNode(node: string) {
    const details = this.graph.getNodeAttributes(node).proposal;
    this.showProposalDetails(details);
  }

  showProposalDetails(details: SnapshotProposal) {
    this.detailsContainer.innerHTML = `
    Proposal ID: ${details.id}<br />  
    Title: ${details.title}
    `;
    this.detailsContainer.style.display = "block";
  }

  handleHoverParticipantNode(node: string) {
    this.showParticipantDetails(this.graph.getNodeAttributes(node).participant);
    this.highlightedNodes.push(node);
    // Show nodes that are outbound to the hovered node (e.g. delegators)
    const outoundEdges = this.graph.outboundEdges(node);
    outoundEdges.forEach((edge) => {
      this.graph.setEdgeAttribute(edge, "color", "#ffd300");
      this.highlightedEdges.push(edge);
      this.highlightedNodes.push(this.graph.source(edge));
    });
    // Show nodes that are inbound to the hovered node and traverse up (e.g. delegate to root)
    for (var i = 0; i < this.highlightedNodes.length; i++) {
      this.graph.setNodeAttribute(
        this.highlightedNodes[i],
        "highlighted",
        true
      );
      const inboundEdges = this.graph.inboundEdges(this.highlightedNodes[i]);
      inboundEdges.forEach((edge) => {
        this.graph.setEdgeAttribute(edge, "color", "#ff0000");
        this.highlightedEdges.push(edge);
        this.highlightedNodes.push(this.graph.source(edge));
      });
    }
  }

  resolveChoice(choice: number): string {
    if (choice == 0 || !this.proposal || choice > this.proposal.choices.length)
      return choice.toString();
    return this.proposal.choices[choice - 1];
  }

  showParticipantDetails(details: SnapshotParticipant) {
    const voteDetails =
      details.choice > 0
        ? `
    Voting Power: ${details.votingPower.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}<br/ >
    Choice: ${this.resolveChoice(details.choice)}
    `
        : `
    Delegated Voting Rights
    `;
    this.detailsContainer.innerHTML = `
    Address: ${details.address}<br/ >
    ${voteDetails}
    `;
    this.detailsContainer.style.display = "block";
  }

  hideDetails() {
    this.detailsContainer.style.display = "none";
  }

  resetHighlightedEdges() {
    this.highlightedEdges.forEach((edge) => {
      this.graph.setEdgeAttribute(edge, "color", undefined);
    });
    this.highlightedEdges = [];
  }

  resetHighlightedNodes() {
    this.highlightedNodes.forEach((node) => {
      this.graph.setNodeAttribute(node, "highlighted", false);
    });
    this.highlightedNodes = [];
  }
}
