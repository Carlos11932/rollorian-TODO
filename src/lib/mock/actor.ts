/**
 * Development stub for the authenticated actor.
 * Replace with real session data when auth is implemented.
 */
import { createAuthorizationActor } from '@/domain/identity';
import { createSpaceId, createUserId, SPACE_TYPE } from '@/domain/shared';
import { createPersonalSpaceAccessContext } from '@/domain/access';
import { createPersonalItemScope } from '@/domain/item';

export const MOCK_USER_ID = createUserId('user-1');
export const MOCK_PERSONAL_SPACE_ID = createSpaceId('space-personal-user-1');

export const MOCK_ACTOR = createAuthorizationActor({
  id: MOCK_USER_ID,
  displayName: 'The Curator',
  email: 'curator@rollorian.dev',
});

export const MOCK_PERSONAL_ACCESS_CONTEXT = createPersonalSpaceAccessContext({
  spaceId: MOCK_PERSONAL_SPACE_ID,
  ownerId: MOCK_USER_ID,
});

export const MOCK_PERSONAL_SCOPE = createPersonalItemScope({
  ownerId: MOCK_USER_ID,
});

export const MOCK_PERSONAL_COMMAND_SPACE = {
  accessContext: MOCK_PERSONAL_ACCESS_CONTEXT,
  scope: MOCK_PERSONAL_SCOPE,
} as const;
