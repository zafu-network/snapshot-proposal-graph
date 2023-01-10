import Chart from "chart.js/auto";
import { loadProposal } from "../data/proposal";
import { SnapshotParticipant } from "../data/types";
import { loadVotes } from "../data/votes";

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);

export const buildTimeline = async (proposalId: string) => {
  if (proposalId.length < 64) throw Error("Unexpected proposal id");
  const porposal = await loadProposal(proposalId);
  const votes = Array.from((await loadVotes(proposalId)).values());
  const canvas = document.getElementById("chart-canvas") as HTMLCanvasElement;
  const votesByChoice = groupBy(votes, (vote) => vote.choice);
  const datasets = Object.entries(votesByChoice).map((group) => {
    const cumulativeSum = (sum => (value: {x: number, y: number}) => { return { x: value.x, y: sum += value.y }})(0);
    return {
      label: "Choice " + group[0],
      data: group[1].map((vote) => {
        return { x: vote.created, y: vote.votingPower };
      }).sort((left, right) => left.x - right.x).map(cumulativeSum),
    };
  });
  console.log({ porposal });
  console.log({ datasets });

  new Chart(canvas, {
    type: "line",
    data: {
      datasets,
    },
    options: {
      scales: {
        y: {
          type: "linear",
          min: 100
        },
        x: {
          type: "linear",
          min: porposal.start,
          max: porposal.end,
        },
      },
    },
  });
};
