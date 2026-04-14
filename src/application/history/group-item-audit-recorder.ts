import {
  createGroupItemAuditEntry,
  type GroupItemAuditEntry,
  type GroupItemAuditSnapshot,
} from "@/domain/history";
import type { ActorMetadata } from "@/domain/identity";

export interface AppendGroupItemAuditEntryRepository {
  append(entry: GroupItemAuditEntry): Promise<void>;
}

export interface RecordGroupItemAuditInput {
  actor: ActorMetadata;
  after: GroupItemAuditSnapshot;
  before: GroupItemAuditSnapshot;
}

export interface GroupItemAuditRecorder {
  record(input: RecordGroupItemAuditInput): Promise<GroupItemAuditEntry | null>;
}

export class AppendOnlyGroupItemAuditRecorder implements GroupItemAuditRecorder {
  public constructor(
    private readonly repository: AppendGroupItemAuditEntryRepository,
  ) {}

  public async record(
    input: RecordGroupItemAuditInput,
  ): Promise<GroupItemAuditEntry | null> {
    const entry = createGroupItemAuditEntry(input);

    if (entry === null) {
      return null;
    }

    await this.repository.append(entry);

    return entry;
  }
}

export const noopGroupItemAuditRecorder: GroupItemAuditRecorder = {
  async record(): Promise<null> {
    return null;
  },
};
