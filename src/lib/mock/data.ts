import type { MockItem, MockGroup, MockUser, MockHistoryEntry } from './types';

// ── Users ─────────────────────────────────────────────────────────────────────

export const MOCK_ME: MockUser = {
  id: 'user-1',
  name: 'The Curator',
  initials: 'TC',
};

export const MOCK_USERS: MockUser[] = [
  MOCK_ME,
  { id: 'user-2', name: 'Elena R.', initials: 'ER', avatarColor: '#004f34' },
  { id: 'user-3', name: 'Marcos G.', initials: 'MG', avatarColor: '#073026' },
  { id: 'user-4', name: 'Julia D.', initials: 'JD', avatarColor: '#143b30' },
  { id: 'user-5', name: 'Miguel P.', initials: 'MP', avatarColor: '#194035' },
];

// ── Groups ────────────────────────────────────────────────────────────────────

export const MOCK_GROUPS: MockGroup[] = [
  {
    id: 'group-1',
    name: 'Archivo Histórico',
    members: MOCK_USERS.slice(0, 4),
  },
  {
    id: 'group-2',
    name: 'Patrimonio',
    members: MOCK_USERS.slice(1, 5),
  },
];

// ── Items — Hoy ───────────────────────────────────────────────────────────────

export const TODAY_ITEMS: MockItem[] = [
  {
    id: 'item-1',
    title: 'Actualizar catálogo de la Biblioteca Privada',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'personal',
    location: 'Sala Central',
    time: '10:00 AM',
    createdAt: '2023-10-09T08:00:00Z',
    tags: ['Prioridad'],
  },
  {
    id: 'item-2',
    title: 'Entrevista con el Archivero Jefe',
    itemType: 'event',
    status: 'pending',
    priority: 'medium',
    spaceType: 'personal',
    location: 'Llamada vía Enlace Seguro',
    time: '14:30 PM',
    createdAt: '2023-10-09T08:00:00Z',
  },
  {
    id: 'item-3',
    title: 'Digitalización de Correspondencia Histórica',
    itemType: 'task',
    status: 'pending',
    priority: 'medium',
    spaceType: 'personal',
    location: 'Laboratorio de Preservación',
    createdAt: '2023-10-09T08:00:00Z',
  },
];

// ── Items — Esta Semana ───────────────────────────────────────────────────────

export const THIS_WEEK_ITEMS: MockItem[] = [
  {
    id: 'item-4',
    title: 'Reunión de Patronos',
    notes: 'Presentación anual sobre el estado de conservación de los activos digitales.',
    itemType: 'event',
    status: 'pending',
    priority: 'urgent',
    spaceType: 'group',
    groupId: 'group-1',
    dueDate: '2023-10-13',
    createdAt: '2023-10-09T08:00:00Z',
    tags: ['Evento Principal'],
  },
  {
    id: 'item-5',
    title: 'Auditoría de Seguridad',
    notes: 'Verificación de protocolos de acceso biométrico en la bóveda.',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[1],
    dueDate: '2023-10-15',
    createdAt: '2023-10-09T08:00:00Z',
  },
  {
    id: 'item-6',
    title: 'Ingreso de Nueva Colección',
    notes: 'Recepción de los archivos legados de la Familia Sterling.',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    dueDate: '2023-10-17',
    createdAt: '2023-10-09T08:00:00Z',
    tags: ['Alta Prioridad'],
  },
];

// ── Items — Requieren Atención ────────────────────────────────────────────────

export const ATTENTION_ITEMS: MockItem[] = [
  {
    id: 'item-7',
    title: 'Revisión de Inventario: Sección A-12',
    notes: 'Existen discrepancias entre los registros físicos y digitales de los manuscritos del siglo XIX.',
    itemType: 'task',
    status: 'pending',
    priority: 'urgent',
    spaceType: 'personal',
    overdueByDays: 3,
    createdAt: '2023-10-06T08:00:00Z',
  },
  {
    id: 'item-8',
    title: 'Restauración de Folio Dorado',
    notes: 'Esperando entrega de solventes especiales desde la capital.',
    itemType: 'task',
    status: 'blocked',
    priority: 'high',
    spaceType: 'personal',
    blockedReason: 'Esperando entrega de solventes especiales desde la capital.',
    createdAt: '2023-10-05T08:00:00Z',
  },
];

// ── Items — Vista de Grupo ────────────────────────────────────────────────────

export const GROUP_ITEMS: MockItem[] = [
  {
    id: 'item-9',
    title: 'Restauración de Manuscritos',
    notes: 'Sección A-12 • Archivo Histórico',
    itemType: 'task',
    status: 'in_progress',
    priority: 'urgent',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[2],
    createdAt: '2023-10-08T08:00:00Z',
  },
  {
    id: 'item-10',
    title: 'Catalogación de Primera Edición',
    notes: 'Colección Orwell • Biblioteca Privada',
    itemType: 'task',
    status: 'in_progress',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[1],
    createdAt: '2023-10-08T08:00:00Z',
    tags: ['Revisión'],
  },
  {
    id: 'item-11',
    title: 'Digitalización de Planos de la Finca',
    notes: 'Infraestructura • Seguridad',
    itemType: 'task',
    status: 'pending',
    priority: 'low',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[3],
    createdAt: '2023-10-07T08:00:00Z',
  },
];

// ── History entries ───────────────────────────────────────────────────────────

export const MOCK_HISTORY: MockHistoryEntry[] = [
  {
    id: 'hist-1',
    actor: MOCK_USERS[2] ?? MOCK_ME,
    action: 'Actualizó el estado a',
    detail: 'Revisión',
    comment: 'La sección de metadatos está completa, falta verificar la calidad de los escaneos.',
    timestamp: 'Hace 12 min',
    icon: 'edit',
    iconColor: 'primary',
  },
  {
    id: 'hist-2',
    actor: MOCK_USERS[1] ?? MOCK_ME,
    action: 'Se unió como',
    detail: 'Editora Invitada',
    timestamp: 'Hoy, 10:45 AM',
    icon: 'person_add',
    iconColor: 'secondary',
  },
  {
    id: 'hist-3',
    actor: MOCK_ME,
    action: 'Tarea creada e indexada en',
    detail: 'Colección Orwell',
    timestamp: 'Ayer, 04:20 PM',
    icon: 'add_box',
    iconColor: 'muted',
  },
];

// ── Stats ─────────────────────────────────────────────────────────────────────

export const MOCK_STATS = {
  undatedPending: 14,
  monthlyProgressPercent: 85,
  totalEntries: 1204,
  activeUsers: 42,
};
