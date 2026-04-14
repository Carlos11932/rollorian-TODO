import {
  createGroupItemScope,
  createItemLabel,
  createPersonalItemScope,
  getItemLabelScopeKey,
  validateItemLabels,
} from "@/domain/item";
import { createGroupId, createUserId } from "@/domain/shared";

describe("label policy", () => {
  it("normalizes and deduplicates labels for consistent future commands", () => {
    const scope = createPersonalItemScope({ ownerId: createUserId("owner-1") });

    const result = validateItemLabels({
      scope,
      labels: ["  Finance  ", "finance", "Q1   Planning"],
    });

    expect(result.isValid).toBe(true);
    expect(result.labels).toEqual([
      { value: "finance" },
      { value: "q1 planning" },
    ]);
    expect(result.scopeKey).toBe("personal:owner-1");
  });

  it("keeps label reuse scoped to the owning group", () => {
    const financeLabel = createItemLabel("Finance");
    const groupScope = createGroupItemScope({
      groupId: createGroupId("group-1"),
      memberships: [],
    });
    const personalScope = createPersonalItemScope({
      ownerId: createUserId("owner-1"),
    });

    expect(financeLabel.value).toBe("finance");
    expect(getItemLabelScopeKey(groupScope)).toBe("group:group-1");
    expect(getItemLabelScopeKey(personalScope)).toBe("personal:owner-1");
  });

  it("rejects empty labels after normalization", () => {
    const scope = createPersonalItemScope({ ownerId: createUserId("owner-1") });

    const result = validateItemLabels({
      scope,
      labels: ["work", "   "],
    });

    expect(result.isValid).toBe(false);
    expect(result.labels).toEqual([{ value: "work" }]);
    expect(result.violations).toEqual(["Item labels cannot be empty."]);
  });
});
