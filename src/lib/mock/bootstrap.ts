import { MEMBERSHIP_ROLE, type MembershipRole } from "@/domain/identity";

export interface MockBootstrapUser {
  id: string;
  displayName: string;
  email: string;
  personalSpaceId: string;
}

export interface MockBootstrapMembership {
  id: string;
  userId: string;
  role: MembershipRole;
}

export interface MockBootstrapGroup {
  id: string;
  spaceId: string;
  memberships: readonly MockBootstrapMembership[];
}

export const MOCK_BOOTSTRAP_USER_IDS = {
  DEFAULT: "user-1",
  TEAMMATE: "user-2",
  GROUP_B_ONLY: "user-3",
  OUTSIDER: "user-4",
} as const;

export const MOCK_BOOTSTRAP_GROUP_IDS = {
  ALPHA: "group-alpha",
  BETA: "group-beta",
} as const;

export const MOCK_BOOTSTRAP_SPACE_IDS = {
  DEFAULT_PERSONAL: "space-personal-user-1",
  TEAMMATE_PERSONAL: "space-personal-user-2",
  GROUP_B_ONLY_PERSONAL: "space-personal-user-3",
  OUTSIDER_PERSONAL: "space-personal-user-4",
  GROUP_ALPHA: "space-group-alpha",
  GROUP_BETA: "space-group-beta",
} as const;

export const MOCK_BOOTSTRAP_MEMBERSHIP_IDS = {
  ALPHA_DEFAULT: "membership-alpha-user-1",
  ALPHA_TEAMMATE: "membership-alpha-user-2",
  BETA_DEFAULT: "membership-beta-user-1",
  BETA_GROUP_B_ONLY: "membership-beta-user-3",
} as const;

export const MOCK_BOOTSTRAP_USERS = [
  {
    displayName: "The Curator",
    email: "curator@rollorian.dev",
    id: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
    personalSpaceId: MOCK_BOOTSTRAP_SPACE_IDS.DEFAULT_PERSONAL,
  },
  {
    displayName: "Archive Partner",
    email: "partner@rollorian.dev",
    id: MOCK_BOOTSTRAP_USER_IDS.TEAMMATE,
    personalSpaceId: MOCK_BOOTSTRAP_SPACE_IDS.TEAMMATE_PERSONAL,
  },
  {
    displayName: "Patrimony Steward",
    email: "steward@rollorian.dev",
    id: MOCK_BOOTSTRAP_USER_IDS.GROUP_B_ONLY,
    personalSpaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_B_ONLY_PERSONAL,
  },
  {
    displayName: "Outsider",
    email: "outsider@rollorian.dev",
    id: MOCK_BOOTSTRAP_USER_IDS.OUTSIDER,
    personalSpaceId: MOCK_BOOTSTRAP_SPACE_IDS.OUTSIDER_PERSONAL,
  },
] as const satisfies readonly MockBootstrapUser[];

export const MOCK_BOOTSTRAP_GROUPS = [
  {
    id: MOCK_BOOTSTRAP_GROUP_IDS.ALPHA,
    memberships: [
      {
        id: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.ALPHA_DEFAULT,
        role: MEMBERSHIP_ROLE.MEMBER,
        userId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
      },
      {
        id: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.ALPHA_TEAMMATE,
        role: MEMBERSHIP_ROLE.MEMBER,
        userId: MOCK_BOOTSTRAP_USER_IDS.TEAMMATE,
      },
    ],
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_ALPHA,
  },
  {
    id: MOCK_BOOTSTRAP_GROUP_IDS.BETA,
    memberships: [
      {
        id: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.BETA_DEFAULT,
        role: MEMBERSHIP_ROLE.MEMBER,
        userId: MOCK_BOOTSTRAP_USER_IDS.DEFAULT,
      },
      {
        id: MOCK_BOOTSTRAP_MEMBERSHIP_IDS.BETA_GROUP_B_ONLY,
        role: MEMBERSHIP_ROLE.MEMBER,
        userId: MOCK_BOOTSTRAP_USER_IDS.GROUP_B_ONLY,
      },
    ],
    spaceId: MOCK_BOOTSTRAP_SPACE_IDS.GROUP_BETA,
  },
] as const satisfies readonly MockBootstrapGroup[];
