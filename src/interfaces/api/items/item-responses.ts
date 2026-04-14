import {
  ITEM_COMMAND_ERROR_CODE,
  type CommandResult,
  type ItemCommandError,
  type ItemOutput,
} from "@/application/commands";
import { z } from "zod";
import { itemDtoSchema, toItemDto, versionTokenSchema } from "./item-dto";
import { itemHistoryDtoSchema, toItemHistoryDto, type ItemHistoryDto } from "./item-history-contract";
import { listItemsRequestQuerySchema } from "./item-requests";

const itemCommandErrorCodeSchema = z.enum([
  ITEM_COMMAND_ERROR_CODE.ACCESS_DENIED,
  ITEM_COMMAND_ERROR_CODE.NOT_FOUND,
  ITEM_COMMAND_ERROR_CODE.SCOPE_MISMATCH,
  ITEM_COMMAND_ERROR_CODE.VALIDATION_FAILED,
  ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT,
]);

const itemErrorBaseSchema = z.object({
  code: itemCommandErrorCodeSchema,
  message: z.string().trim().min(1),
});

const versionConflictErrorSchema = itemErrorBaseSchema.extend({
  actualVersionToken: versionTokenSchema,
  code: z.literal(ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT),
  expectedVersionToken: versionTokenSchema,
});

const validationErrorSchema = itemErrorBaseSchema.extend({
  code: z.literal(ITEM_COMMAND_ERROR_CODE.VALIDATION_FAILED),
  violations: z.array(z.string().trim().min(1)).min(1),
});

const scopeMismatchErrorSchema = itemErrorBaseSchema.extend({
  code: z.literal(ITEM_COMMAND_ERROR_CODE.SCOPE_MISMATCH),
  violations: z.array(z.string().trim().min(1)).min(1),
});

const basicItemErrorSchema = z.object({
  code: z.union([
    z.literal(ITEM_COMMAND_ERROR_CODE.ACCESS_DENIED),
    z.literal(ITEM_COMMAND_ERROR_CODE.NOT_FOUND),
  ]),
  message: z.string().trim().min(1),
});

export const itemErrorSchema = z.union([
  basicItemErrorSchema,
  validationErrorSchema,
  scopeMismatchErrorSchema,
  versionConflictErrorSchema,
]);

export const itemResponseSchema = z.object({
  data: itemDtoSchema,
});

export const itemListResponseSchema = z.object({
  data: z.object({
    filters: listItemsRequestQuerySchema,
    items: z.array(itemDtoSchema),
    totalCount: z.number().int().nonnegative(),
  }),
});

export const itemErrorResponseSchema = z.object({
  error: itemErrorSchema,
});

export const itemHistoryResponseSchema = z.object({
  data: itemHistoryDtoSchema,
});

export type ItemResponse = z.infer<typeof itemResponseSchema>;
export type ItemListResponse = z.infer<typeof itemListResponseSchema>;
export type ItemErrorResponse = z.infer<typeof itemErrorResponseSchema>;
export type ItemHistoryResponse = z.infer<typeof itemHistoryResponseSchema>;

export function toItemResponse(item: ItemOutput): ItemResponse {
  return itemResponseSchema.parse({
    data: toItemDto(item),
  });
}

export function toItemListResponse(
  items: readonly ItemOutput[],
  filters: z.infer<typeof listItemsRequestQuerySchema>,
): ItemListResponse {
  return itemListResponseSchema.parse({
    data: {
      filters,
      items: items.map((item) => toItemDto(item)),
      totalCount: items.length,
    },
  });
}

export function toItemErrorResponse(error: ItemCommandError): ItemErrorResponse {
  return itemErrorResponseSchema.parse({ error });
}

export function toItemCommandResultResponse(
  result: CommandResult<ItemOutput>,
): ItemResponse | ItemErrorResponse {
  return result.ok ? toItemResponse(result.value) : toItemErrorResponse(result.error);
}

export function toItemHistoryResponse(data: ItemHistoryDto): ItemHistoryResponse {
  return itemHistoryResponseSchema.parse({ data });
}

export function toItemHistoryEntriesResponse(
  itemId: string,
  entries: Parameters<typeof toItemHistoryDto>[1],
): ItemHistoryResponse {
  return toItemHistoryResponse(toItemHistoryDto(itemId, entries));
}
