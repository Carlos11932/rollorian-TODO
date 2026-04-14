import {
  isEligibleForUndatedView,
  type ItemViewQueryRepository,
  type ViewActorContext,
  type ViewResult,
  type ViewSpaceFilter,
} from "./shared";

export interface GetUndatedViewQuery extends ViewActorContext {
  spaceFilter: ViewSpaceFilter;
}

export interface UndatedViewResult extends ViewResult {
  spaceFilter: ViewSpaceFilter;
}

export class GetUndatedViewQueryHandler {
  public constructor(private readonly repository: ItemViewQueryRepository) {}

  public async execute(query: GetUndatedViewQuery): Promise<UndatedViewResult> {
    const items = (await this.repository.listProjectedItems()).filter((record) =>
      isEligibleForUndatedView(record, query, query.spaceFilter),
    );

    return {
      items,
      spaceFilter: query.spaceFilter,
      totalCount: items.length,
    };
  }
}
