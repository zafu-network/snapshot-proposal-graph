export interface SnapshotParticipant {
  address: string;
  votingPower: number;
  choice: number;
  hasDelegates: boolean;
  created: number;
}

export interface SnapshotDelegator extends SnapshotParticipant {
  space: string
}
