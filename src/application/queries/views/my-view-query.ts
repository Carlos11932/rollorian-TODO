import {
  isEligibleForMyView,
  type ItemViewQueryRepository,
  type ViewActorContext,
  type ViewResult,
} from "./shared";

export type GetMyViewQuery = ViewActorContext;
export type MyViewResult = ViewResult;

export class GetMyViewQueryHandler {
  public constructor(private readonly repository: ItemViewQueryRepository) {}

  public async execute(query: GetMyViewQuery): Promise<MyViewResult> {
    const items = (await this.repository.listProjectedItems()).filter((record) =>
      isEligibleForMyView(record, query),
    );

    return {
      items,
      totalCount: items.length,
    };
  }
}
