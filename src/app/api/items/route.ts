import { NextResponse } from 'next/server';
import { createItemId } from '@/domain/shared';
import { ITEM_TYPE } from '@/domain/shared';
import type { Priority } from '@/domain/shared';
import type { ItemType } from '@/domain/shared';
import { isPriority } from '@/domain/shared';
import {
  createTaskUndatedTemporal,
  createTaskDueDateTemporal,
  createEventStartTemporal,
} from '@/domain/item';
import { createItemHandler } from '@/lib/item-command-factory';
import { MOCK_ACTOR, MOCK_PERSONAL_COMMAND_SPACE } from '@/lib/mock/actor';
import { toItemView } from '@/interfaces/views/item-view';

interface CreateItemBody {
  title?: unknown;
  itemType?: unknown;
  priority?: unknown;
  date?: unknown;
}

export async function POST(request: Request) {
  let body: CreateItemBody;
  try {
    body = (await request.json()) as CreateItemBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const itemType = body.itemType;
  if (itemType !== 'task' && itemType !== 'event') {
    return NextResponse.json({ error: 'itemType must be "task" or "event"' }, { status: 400 });
  }

  const priority: Priority = isPriority(body.priority as string)
    ? (body.priority as Priority)
    : 'medium';

  const dateStr = typeof body.date === 'string' ? body.date : undefined;
  const itemId = createItemId(crypto.randomUUID());

  const result =
    itemType === ITEM_TYPE.TASK
      ? await createItemHandler.execute({
          actor: MOCK_ACTOR,
          itemId,
          title,
          priority,
          space: MOCK_PERSONAL_COMMAND_SPACE,
          itemType: ITEM_TYPE.TASK,
          temporal: dateStr
            ? createTaskDueDateTemporal(new Date(dateStr))
            : createTaskUndatedTemporal(),
        })
      : await createItemHandler.execute({
          actor: MOCK_ACTOR,
          itemId,
          title,
          priority,
          space: MOCK_PERSONAL_COMMAND_SPACE,
          itemType: ITEM_TYPE.EVENT,
          temporal: createEventStartTemporal(dateStr ? new Date(dateStr) : new Date()),
        });

  if (!result.ok) {
    const status = result.error.code === 'validation_failed' ? 422 : 403;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(toItemView(result.value), { status: 201 });
}
