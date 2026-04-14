import type { ViewActorContext, ViewResult } from "./shared";
import { isEligibleForMyView, type ItemViewQueryRepository } from "./shared";

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
