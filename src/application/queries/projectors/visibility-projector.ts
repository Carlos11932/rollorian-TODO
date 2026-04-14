import { SPACE_TYPE } from "@/domain/shared";
import { MY_VIEW_MEMBERSHIP, QUERY_VISIBILITY_SCOPE, type ProjectableItemRecord, type VisibilityProjection } from "./types";

export function projectVisibility(record: ProjectableItemRecord): VisibilityProjection {
  if (record.spaceType === SPACE_TYPE.PERSONAL) {
    return {
      groupId: null,
      groupViewGroupId: null,
      myViewMembership: MY_VIEW_MEMBERSHIP.PERSONAL_OWNER,
      ownerId: record.ownerId,
      visibilityScope: QUERY_VISIBILITY_SCOPE.PERSONAL_OWNER,
    };
  }

  return {
    groupId: record.groupId,
    groupViewGroupId: record.groupId,
    myViewMembership: MY_VIEW_MEMBERSHIP.GROUP_ASSIGNEE_OR_UNASSIGNED,
    ownerId: null,
    visibilityScope: QUERY_VISIBILITY_SCOPE.GROUP_MEMBERS,
  };
}
