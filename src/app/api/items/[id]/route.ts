import { NextResponse } from 'next/server';
import { createItemId } from '@/domain/shared';
import { ITEM_TYPE } from '@/domain/shared';
import { isPriority } from '@/domain/shared';
import type { Priority } from '@/domain/shared';
import {
  TASK_STATUS,
  EVENT_STATUS,
  createTaskPendingLifecycle,
  createTaskInProgressLifecycle,
  createTaskBlockedLifecycle,
  createTaskPostponedLifecycle,
  createTaskDoneLifecycle,
  createTaskCanceledLifecycle,
  createEventScheduledLifecycle,
  createEventCompletedLifecycle,
  createEventCanceledLifecycle,
} from '@/domain/item';
import type { TaskStatus, EventStatus } from '@/domain/item';
import { readItemByIdHandler, updateItemHandler } from '@/lib/item-command-factory';
import { MOCK_ACTOR, MOCK_PERSONAL_COMMAND_SPACE } from '@/lib/mock/actor';
import { toItemView } from '@/interfaces/views/item-view';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  let itemId;
  try {
    itemId = createItemId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  const result = await readItemByIdHandler.execute({
    actor: MOCK_ACTOR,
    itemId,
    space: MOCK_PERSONAL_COMMAND_SPACE,
  });

  if (!result.ok) {
    const status = result.error.code === 'not_found' ? 404 : 403;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(toItemView(result.value));
}

interface PatchItemBody {
  status?: unknown;
  priority?: unknown;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let itemId;
  try {
    itemId = createItemId(id);
  } catch {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  let body: PatchItemBody;
  try {
    body = (await request.json()) as PatchItemBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch current item to determine its type
  const readResult = await readItemByIdHandler.execute({
    actor: MOCK_ACTOR,
    itemId,
    space: MOCK_PERSONAL_COMMAND_SPACE,
  });

  if (!readResult.ok) {
    const status = readResult.error.code === 'not_found' ? 404 : 403;
    return NextResponse.json({ error: readResult.error.message }, { status });
  }

  const currentItem = readResult.value;
  const now = new Date();

  // Build update payload
  const priority: Priority | undefined = isPriority(body.priority as string)
    ? (body.priority as Priority)
    : undefined;

  if (currentItem.itemType === ITEM_TYPE.TASK) {
    const lifecycle =
      typeof body.status === 'string'
        ? buildTaskLifecycle(body.status as TaskStatus, now)
        : undefined;

    if (body.status !== undefined && lifecycle === null) {
      return NextResponse.json(
        { error: `Invalid task status: ${body.status}` },
        { status: 400 },
      );
    }

    const updateResult = await updateItemHandler.execute({
      actor: MOCK_ACTOR,
      itemId,
      space: MOCK_PERSONAL_COMMAND_SPACE,
      itemType: ITEM_TYPE.TASK,
      ...(lifecycle ? { lifecycle } : {}),
      ...(priority ? { priority } : {}),
    });

    if (!updateResult.ok) {
      return NextResponse.json({ error: updateResult.error.message }, { status: 422 });
    }

    return NextResponse.json(toItemView(updateResult.value));
  }

  const lifecycle =
    typeof body.status === 'string'
      ? buildEventLifecycle(body.status as EventStatus, now)
      : undefined;

  if (body.status !== undefined && lifecycle === null) {
    return NextResponse.json(
      { error: `Invalid event status: ${body.status}` },
      { status: 400 },
    );
  }

  const updateResult = await updateItemHandler.execute({
    actor: MOCK_ACTOR,
    itemId,
    space: MOCK_PERSONAL_COMMAND_SPACE,
    itemType: ITEM_TYPE.EVENT,
    ...(lifecycle ? { lifecycle } : {}),
    ...(priority ? { priority } : {}),
  });

  if (!updateResult.ok) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 422 });
  }

  return NextResponse.json(toItemView(updateResult.value));
}

function buildTaskLifecycle(status: TaskStatus, now: Date) {
  switch (status) {
    case TASK_STATUS.PENDING:
      return createTaskPendingLifecycle();
    case TASK_STATUS.IN_PROGRESS:
      return createTaskInProgressLifecycle();
    case TASK_STATUS.BLOCKED:
      return createTaskBlockedLifecycle();
    case TASK_STATUS.POSTPONED:
      return createTaskPostponedLifecycle(now);
    case TASK_STATUS.DONE:
      return createTaskDoneLifecycle(now);
    case TASK_STATUS.CANCELED:
      return createTaskCanceledLifecycle(now);
    default:
      return null;
  }
}

function buildEventLifecycle(status: EventStatus, now: Date) {
  switch (status) {
    case EVENT_STATUS.SCHEDULED:
      return createEventScheduledLifecycle();
    case EVENT_STATUS.COMPLETED:
      return createEventCompletedLifecycle(now);
    case EVENT_STATUS.CANCELED:
      return createEventCanceledLifecycle(now);
    default:
      return null;
  }
}
