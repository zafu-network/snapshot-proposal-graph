import { buildGraph } from "./network";
import { buildTimeline } from "./timeline";

const showError = async (status: string) => {
  const loadingContainer = document.getElementById(
    "loading-container"
  ) as HTMLElement;
  loadingContainer.textContent = status;
};

export const renderVoteDistribution = () => {
  var url = new URL(window.location.href)
  const proposalId = url.searchParams.get("proposal")!!
  console.log({proposalId})
  buildGraph(proposalId).catch(() => {
    showError("Cannot process proposal: " + proposalId)
  });
}

export const renderTimeline = () => {
  var url = new URL(window.location.href)
  const proposalId = url.searchParams.get("proposal")!!
  console.log({proposalId})
  buildTimeline(proposalId).catch((e) => {
    console.log(e)
  });
}