import { SnapshotDelegator, SnapshotParticipant } from "../data/types";

const shortString = (value: string) => {
  const length = value.length;
  if (length <= 12) return value;
  return value.slice(0, 6) + "..." + value.slice(length - 4, length);
};

export const buildParticipantLabel = (participant: SnapshotParticipant) => {
  return (
    shortString(participant.address)
  );
};

export const buildDelegatorLabel = (delegator: SnapshotDelegator) => {
  if (delegator.choice != 0) return buildParticipantLabel(delegator);
  return `${shortString(delegator.address)} (${delegator.space})`;
};
