import {
  createCalendarRange,
  matchesViewSpaceFilter,
  overlapsCalendarRange,
  type CalendarRange,
  type ItemViewQueryRepository,
  type ViewActorContext,
  type ViewResult,
  type ViewSpaceFilter,
} from "./shared";

export interface GetCalendarViewQuery extends ViewActorContext {
  range: CalendarRange;
  spaceFilter: ViewSpaceFilter;
}

export interface CalendarViewResult extends ViewResult {
  range: CalendarRange;
  spaceFilter: ViewSpaceFilter;
}

export class GetCalendarViewQueryHandler {
  public constructor(private readonly repository: ItemViewQueryRepository) {}

  public async execute(query: GetCalendarViewQuery): Promise<CalendarViewResult> {
    const range = createCalendarRange(query.range.startAt, query.range.endAt);
    const items = (await this.repository.listProjectedItems()).filter(
      (record) =>
        matchesViewSpaceFilter(record, query, query.spaceFilter) &&
        overlapsCalendarRange(record, range),
    );

    return {
      items,
      range,
      spaceFilter: query.spaceFilter,
      totalCount: items.length,
    };
  }
}
