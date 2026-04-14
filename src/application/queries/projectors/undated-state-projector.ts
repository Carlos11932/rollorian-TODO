import type { Item } from "@/domain/item";
import type { UndatedStateProjection } from "./types";
import { projectDatedSpan } from "./dated-span-projector";

export function projectUndatedState(item: Item): UndatedStateProjection {
  return {
    isUndated: !projectDatedSpan(item).isDated,
  };
}
