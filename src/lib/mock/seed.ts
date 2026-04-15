/**
 * Development data seed.
 *
 * Populates the InMemoryItemRepository with realistic domain items on
 * module load. Called once from item-command-factory.ts at startup.
 *
 * NOT for production. Remove when Prisma + migrations land.
 */
import { createGroupMembership, MEMBERSHIP_ROLE } from '@/domain/identity';
import {
  createItemId,
  createUserId,
  createGroupId,
  createSpaceId,
  createMembershipId,
  ITEM_TYPE,
  PRIORITY,
} from '@/domain/shared';
import {
  createTaskPendingLifecycle,
  createTaskInProgressLifecycle,
  createTaskBlockedLifecycle,
  createTaskDueDateTemporal,
  createTaskUndatedTemporal,
  createEventStartTemporal,
  createEventScheduledLifecycle,
} from '@/domain/item';
import { createPersonalSpaceAccessContext, createGroupSpaceAccessContext } from '@/domain/access';
import { createPersonalItemScope, createGroupItemScope } from '@/domain/item';
import { createAuthorizationActor } from '@/domain/identity';
import type { CreateItemCommandHandler } from '@/application/commands';

// ── Shared IDs ────────────────────────────────────────────────────────────────

export const SEED_USER_IDS = {
  carlos: createUserId('user-1'),
  ana: createUserId('user-2'),
  luis: createUserId('user-3'),
  sara: createUserId('user-4'),
  diego: createUserId('user-5'),
} as const;

export const SEED_GROUP_IDS = {
  alpha: createGroupId('group-1'),
  producto: createGroupId('group-2'),
} as const;

export const SEED_SPACE_IDS = {
  carlosPersonal: createSpaceId('space-personal-user-1'),
  alpha: createSpaceId('space-group-1'),
  producto: createSpaceId('space-group-2'),
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(offsetDays = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

function makePersonalSpace(userId = SEED_USER_IDS.carlos, spaceId = SEED_SPACE_IDS.carlosPersonal) {
  return {
    accessContext: createPersonalSpaceAccessContext({ spaceId, ownerId: userId }),
    scope: createPersonalItemScope({ ownerId: userId }),
  };
}

function makeGroupSpace(groupId: ReturnType<typeof createGroupId>, spaceId: ReturnType<typeof createSpaceId>, memberIds: Array<ReturnType<typeof createUserId>>) {
  const memberships = memberIds.map((userId, idx) =>
    createGroupMembership({
      id: createMembershipId(`mem-${groupId}-${idx}`),
      groupId,
      userId,
      role: idx === 0 ? MEMBERSHIP_ROLE.OWNER : MEMBERSHIP_ROLE.MEMBER,
      isActive: true,
    }),
  );

  return {
    accessContext: createGroupSpaceAccessContext({ spaceId, groupId, memberships }),
    scope: createGroupItemScope({ groupId, memberships }),
  };
}

function makeActor(userId: ReturnType<typeof createUserId>, displayName: string) {
  return createAuthorizationActor({ id: userId, displayName, email: `${displayName.toLowerCase().replace(' ', '.')}@rollorian.dev` });
}

// ── Seed ─────────────────────────────────────────────────────────────────────

export async function seedDevItems(handler: CreateItemCommandHandler): Promise<void> {
  const carlosActor = makeActor(SEED_USER_IDS.carlos, 'Carlos B');
  const anaActor = makeActor(SEED_USER_IDS.ana, 'Ana M');
  const personalSpace = makePersonalSpace();
  const alphaGroupIds = [SEED_USER_IDS.carlos, SEED_USER_IDS.ana, SEED_USER_IDS.luis, SEED_USER_IDS.sara];
  const alphaSpace = makeGroupSpace(SEED_GROUP_IDS.alpha, SEED_SPACE_IDS.alpha, alphaGroupIds);
  const productoGroupIds = [SEED_USER_IDS.ana, SEED_USER_IDS.luis, SEED_USER_IDS.sara, SEED_USER_IDS.diego];
  const productoSpace = makeGroupSpace(SEED_GROUP_IDS.producto, SEED_SPACE_IDS.producto, productoGroupIds);

  const seeds: Parameters<typeof handler.execute>[0][] = [
    // ── Today (personal) ───────────────────────────────────────────────────
    {
      actor: carlosActor,
      itemId: createItemId('item-1'),
      title: 'Revisar pull requests del sprint',
      priority: PRIORITY.HIGH,
      space: personalSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today()),
      assigneeIds: [SEED_USER_IDS.carlos],
    },
    {
      actor: carlosActor,
      itemId: createItemId('item-2'),
      title: 'Llamada con cliente (demo)',
      priority: PRIORITY.MEDIUM,
      space: personalSpace,
      itemType: ITEM_TYPE.EVENT,
      temporal: createEventStartTemporal(today()),
      assigneeIds: [SEED_USER_IDS.carlos],
    },
    {
      actor: carlosActor,
      itemId: createItemId('item-3'),
      title: 'Actualizar documentación de API',
      priority: PRIORITY.MEDIUM,
      space: personalSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today()),
      assigneeIds: [SEED_USER_IDS.carlos],
    },

    // ── This Week ──────────────────────────────────────────────────────────
    {
      actor: carlosActor,
      itemId: createItemId('item-4'),
      title: 'Reunión de planificación',
      priority: PRIORITY.URGENT,
      space: alphaSpace,
      itemType: ITEM_TYPE.EVENT,
      temporal: createEventStartTemporal(today(2)),
      assigneeIds: [SEED_USER_IDS.carlos, SEED_USER_IDS.ana],
    },
    {
      actor: anaActor,
      itemId: createItemId('item-5'),
      title: 'Code review módulo de pagos',
      priority: PRIORITY.HIGH,
      space: alphaSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today(3)),
      assigneeIds: [SEED_USER_IDS.ana],
    },
    {
      actor: carlosActor,
      itemId: createItemId('item-6'),
      title: 'Deploy a producción',
      priority: PRIORITY.HIGH,
      space: alphaSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today(4)),
      assigneeIds: [SEED_USER_IDS.carlos, SEED_USER_IDS.luis],
    },

    // ── Attention: overdue (personal) ──────────────────────────────────────
    {
      actor: carlosActor,
      itemId: createItemId('item-7'),
      title: 'Corregir bug en formulario de login',
      priority: PRIORITY.URGENT,
      space: personalSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today(-2)), // 2 days overdue
      notes: 'Los usuarios no pueden hacer login con email que contiene mayúsculas.',
      assigneeIds: [SEED_USER_IDS.carlos],
    },

    // ── Group items ────────────────────────────────────────────────────────
    {
      actor: anaActor,
      itemId: createItemId('item-9'),
      title: 'Diseño de pantallas de onboarding',
      priority: PRIORITY.URGENT,
      space: alphaSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskUndatedTemporal(),
      assigneeIds: [SEED_USER_IDS.luis],
      notes: 'Flujo de registro · Equipo Alpha',
    },
    {
      actor: anaActor,
      itemId: createItemId('item-10'),
      title: 'Refactorizar servicio de autenticación',
      priority: PRIORITY.HIGH,
      space: alphaSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskUndatedTemporal(),
      assigneeIds: [SEED_USER_IDS.ana],
      notes: 'Migración a JWT · Backend',
    },
    {
      actor: carlosActor,
      itemId: createItemId('item-11'),
      title: 'Configurar pipeline de CI/CD',
      priority: PRIORITY.LOW,
      space: alphaSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskUndatedTemporal(),
      assigneeIds: [SEED_USER_IDS.sara],
      notes: 'GitHub Actions · Infraestructura',
    },
    {
      actor: carlosActor,
      itemId: createItemId('item-12'),
      title: 'Integración con Stripe',
      priority: PRIORITY.HIGH,
      space: personalSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today(-1)), // 1 day overdue → attention
      notes: 'Esperando credenciales del equipo de pagos.',
      assigneeIds: [SEED_USER_IDS.carlos],
    },
    {
      actor: anaActor,
      itemId: createItemId('item-13'),
      title: 'Nueva sección de analíticas',
      priority: PRIORITY.MEDIUM,
      space: productoSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskDueDateTemporal(today(5)),
      assigneeIds: [SEED_USER_IDS.ana, SEED_USER_IDS.diego],
    },
    // ── Undated backlog ────────────────────────────────────────────────────
    ...Array.from({ length: 14 }, (_, i) => ({
      actor: carlosActor,
      itemId: createItemId(`item-backlog-${i + 1}`),
      title: [
        'Revisar arquitectura del módulo de notificaciones',
        'Documentar endpoints de la API v3',
        'Optimizar queries lentas en dashboard',
        'Actualizar dependencias del proyecto',
        'Crear tests E2E para el flujo de pago',
        'Migrar imágenes a CDN',
        'Implementar modo oscuro en panel admin',
        'Revisar política de CORS',
        'Refactorizar componentes legacy',
        'Configurar alertas de Datadog',
        'Escribir post-mortem del incidente de marzo',
        'Preparar demo para inversores Q2',
        'Revisar contratos de API con equipo móvil',
        'Mejorar mensajes de error en formularios',
      ][i]!,
      priority: [PRIORITY.LOW, PRIORITY.MEDIUM, PRIORITY.HIGH, PRIORITY.LOW, PRIORITY.MEDIUM][i % 5]!,
      space: personalSpace,
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskUndatedTemporal(),
      assigneeIds: [SEED_USER_IDS.carlos],
    } satisfies Parameters<typeof handler.execute>[0])),
  ];

  for (const input of seeds) {
    const result = await handler.execute(input);
    if (!result.ok) {
      // Seeds must always succeed — fail loudly in dev
      throw new Error(`[seed] Failed to create item "${(input as { title: string }).title}": ${result.error.message}`);
    }
  }

  // After seeding, set item-7 lifecycle to pending (already is) but item-12 needs to be set
  // Note: blocked status requires a separate updateItem call with lifecycle
  // The overdue detection is purely projection-based (dueAt < now) so item-7 and item-12
  // will appear in attention view automatically via projectors.
}
