import { RecoveryClassification, TaskPriority } from '../types/index.interface';

export interface IRecoveryTaskConfig {
  day: number;
  title: string;
  description: string;
  priority: TaskPriority;
}

export interface IRecoveryEngineConfig {
  duration: number;
  calls: number[];
  messages: number[];
  tasks: IRecoveryTaskConfig[];
}

export const RECOVERY_ENGINES: Record<RecoveryClassification, IRecoveryEngineConfig> = {
  [RecoveryClassification.MERCHANT]: {
    duration: 21,
    calls: [],
    messages: [1],
    tasks: [],
  },

  [RecoveryClassification.FINANCIAL_INSTITUTION]: {
    duration: 30,
    calls: [1, 3, 4, 11, 19],
    messages: [1, 2, 7, 14, 22, 24],
    tasks: [
      {
        day: 16,
        title: 'Phone number Verification',
        description: "Review the customer's registered phone number.",
        priority: TaskPriority.HIGH,
      },
      {
        day: 27,
        title: 'Case Review',
        description: 'Staff review the case and decide what is left to try.',
        priority: TaskPriority.HIGH,
      },
      {
        day: 30,
        title: 'Send Report to Lender',
        description: 'Send the lender the report. Case moves to the next owner.',
        priority: TaskPriority.HIGH,
      },
    ],
  },
};
