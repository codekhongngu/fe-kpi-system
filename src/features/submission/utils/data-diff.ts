export interface DataCell {
  indicatorId: string;
  attributeId: string;
  value: string | null;
  valueNumeric: number | null;
}

export interface SubmissionSnapshot {
  cells: DataCell[];
  metadata?: {
    completionPct?: number;
    version?: number;
  };
}

export interface DiffResult {
  indicatorId: string;
  attributeId: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  isChanged: boolean;
}

export function compareSnapshots(
  oldSnapshot: SubmissionSnapshot | null,
  newSnapshot: SubmissionSnapshot
): DiffResult[] {
  const diffs: DiffResult[] = [];
  const oldMap = new Map<string, DataCell>();

  if (oldSnapshot) {
    oldSnapshot.cells.forEach((cell) => {
      oldMap.set(`${cell.indicatorId}:${cell.attributeId}`, cell);
    });
  }

  newSnapshot.cells.forEach((newCell) => {
    const key = `${newCell.indicatorId}:${newCell.attributeId}`;
    const oldCell = oldMap.get(key);

    const oldVal = oldCell ? (oldCell.valueNumeric ?? oldCell.value) : null;
    const newVal = newCell.valueNumeric ?? newCell.value;

    if (oldVal !== newVal) {
      diffs.push({
        indicatorId: newCell.indicatorId,
        attributeId: newCell.attributeId,
        oldValue: oldVal,
        newValue: newVal,
        isChanged: true,
      });
    }
  });

  return diffs;
}
