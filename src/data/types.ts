export interface SnapshotParticipant {
  address: string;
  votingPower: number;
  choice: number;
  hasDelegates: boolean;
}

export interface SnapshotDelegator extends SnapshotParticipant {
  space: string
}
