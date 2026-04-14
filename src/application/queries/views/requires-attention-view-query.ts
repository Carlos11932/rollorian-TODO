import {
  isEligibleForAttentionView,
  type ItemViewQueryRepository,
  type ViewActorContext,
  type ViewResult,
  type ViewSpaceFilter,
} from "./shared";

export interface GetRequiresAttentionViewQuery extends ViewActorContext {
  spaceFilter: ViewSpaceFilter;
}

export interface RequiresAttentionViewResult extends ViewResult {
  spaceFilter: ViewSpaceFilter;
}

export class GetRequiresAttentionViewQueryHandler {
  public constructor(private readonly repository: ItemViewQueryRepository) {}

  public async execute(
    query: GetRequiresAttentionViewQuery,
  ): Promise<RequiresAttentionViewResult> {
    const items = (await this.repository.listProjectedItems()).filter((record) =>
      isEligibleForAttentionView(record, query, query.spaceFilter),
    );

    return {
      items,
      spaceFilter: query.spaceFilter,
      totalCount: items.length,
    };
  }
}
