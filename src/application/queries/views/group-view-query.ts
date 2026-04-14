import type { GroupId } from "@/domain/shared";
import {
  isEligibleForGroupView,
  type ItemViewQueryRepository,
  type ViewActorContext,
  type ViewResult,
} from "./shared";

export interface GetGroupViewQuery extends ViewActorContext {
  groupId: GroupId;
}

export interface GroupViewResult extends ViewResult {
  groupId: GroupId;
}

export class GetGroupViewQueryHandler {
  public constructor(private readonly repository: ItemViewQueryRepository) {}

  public async execute(query: GetGroupViewQuery): Promise<GroupViewResult> {
    const items = (await this.repository.listProjectedItems()).filter((record) =>
      isEligibleForGroupView(record, query, query.groupId),
    );

    return {
      groupId: query.groupId,
      items,
      totalCount: items.length,
    };
  }
}
