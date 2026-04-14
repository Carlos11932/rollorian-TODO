import type { MockItem, MockGroup, MockUser, MockHistoryEntry } from './types';

// ── Users ─────────────────────────────────────────────────────────────────────

export const MOCK_ME: MockUser = {
  id: 'user-1',
  name: 'Carlos B.',
  initials: 'CB',
};

export const MOCK_USERS: MockUser[] = [
  MOCK_ME,
  { id: 'user-2', name: 'Ana M.', initials: 'AM', avatarColor: '#004f34' },
  { id: 'user-3', name: 'Luis G.', initials: 'LG', avatarColor: '#073026' },
  { id: 'user-4', name: 'Sara P.', initials: 'SP', avatarColor: '#143b30' },
  { id: 'user-5', name: 'Diego F.', initials: 'DF', avatarColor: '#194035' },
];

// ── Groups ────────────────────────────────────────────────────────────────────

export const MOCK_GROUPS: MockGroup[] = [
  {
    id: 'group-1',
    name: 'Equipo Alpha',
    members: MOCK_USERS.slice(0, 4),
  },
  {
    id: 'group-2',
    name: 'Producto',
    members: MOCK_USERS.slice(1, 5),
  },
];

// ── Items — Hoy ───────────────────────────────────────────────────────────────

export const TODAY_ITEMS: MockItem[] = [
  {
    id: 'item-1',
    title: 'Revisar pull requests del sprint',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'personal',
    time: '10:00 AM',
    createdAt: '2024-04-12T08:00:00Z',
    tags: ['Prioridad'],
  },
  {
    id: 'item-2',
    title: 'Llamada con cliente (demo)',
    itemType: 'event',
    status: 'pending',
    priority: 'medium',
    spaceType: 'personal',
    location: 'Google Meet',
    time: '14:30 PM',
    createdAt: '2024-04-12T08:00:00Z',
  },
  {
    id: 'item-3',
    title: 'Actualizar documentación de API',
    itemType: 'task',
    status: 'pending',
    priority: 'medium',
    spaceType: 'personal',
    createdAt: '2024-04-13T08:00:00Z',
  },
];

// ── Items — Esta Semana ───────────────────────────────────────────────────────

export const THIS_WEEK_ITEMS: MockItem[] = [
  {
    id: 'item-4',
    title: 'Reunión de planificación',
    notes: 'Sprint planning del Q2 con el equipo de producto.',
    itemType: 'event',
    status: 'pending',
    priority: 'urgent',
    spaceType: 'group',
    groupId: 'group-1',
    dueDate: '16 Abr, 2024',
    createdAt: '2024-04-12T08:00:00Z',
    tags: ['Sprint'],
  },
  {
    id: 'item-5',
    title: 'Code review módulo de pagos',
    notes: 'Revisión del PR #87 antes del merge a main.',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[1],
    dueDate: '17 Abr, 2024',
    createdAt: '2024-04-12T08:00:00Z',
  },
  {
    id: 'item-6',
    title: 'Deploy a producción',
    notes: 'Release v2.4.0 con las mejoras del formulario de checkout.',
    itemType: 'task',
    status: 'pending',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    dueDate: '18 Abr, 2024',
    createdAt: '2024-04-13T08:00:00Z',
    tags: ['Release'],
  },
];

// ── Items — Requieren Atención ────────────────────────────────────────────────

export const ATTENTION_ITEMS: MockItem[] = [
  {
    id: 'item-7',
    title: 'Corregir bug en formulario de login',
    notes: 'Los usuarios no pueden hacer login con email que contiene mayúsculas.',
    itemType: 'task',
    status: 'pending',
    priority: 'urgent',
    spaceType: 'personal',
    overdueByDays: 2,
    createdAt: '2024-04-11T08:00:00Z',
  },
  {
    id: 'item-8',
    title: 'Integración con Stripe',
    notes: 'Esperando credenciales del equipo de pagos.',
    itemType: 'task',
    status: 'blocked',
    priority: 'high',
    spaceType: 'personal',
    blockedReason: 'Esperando credenciales del equipo de pagos',
    createdAt: '2024-04-12T08:00:00Z',
  },
];

// ── Items — Vista de Grupo ────────────────────────────────────────────────────

export const GROUP_ITEMS: MockItem[] = [
  {
    id: 'item-9',
    title: 'Diseño de pantallas de onboarding',
    notes: 'Flujo de registro · Equipo Alpha',
    itemType: 'task',
    status: 'in_progress',
    priority: 'urgent',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[2],
    createdAt: '2024-04-12T08:00:00Z',
  },
  {
    id: 'item-10',
    title: 'Refactorizar servicio de autenticación',
    notes: 'Migración a JWT · Backend',
    itemType: 'task',
    status: 'in_progress',
    priority: 'high',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[1],
    createdAt: '2024-04-12T08:00:00Z',
    tags: ['Revisión'],
  },
  {
    id: 'item-11',
    title: 'Configurar pipeline de CI/CD',
    notes: 'GitHub Actions · Infraestructura',
    itemType: 'task',
    status: 'pending',
    priority: 'low',
    spaceType: 'group',
    groupId: 'group-1',
    assignee: MOCK_USERS[3],
    createdAt: '2024-04-13T08:00:00Z',
  },
];

// ── History entries ───────────────────────────────────────────────────────────

export const MOCK_HISTORY: MockHistoryEntry[] = [
  {
    id: 'hist-1',
    actor: MOCK_USERS[2] ?? MOCK_ME,
    action: 'Actualizó el estado a',
    detail: 'En progreso',
    comment: 'La lógica de validación está lista, falta cubrir los edge cases con tests.',
    timestamp: 'Hace 12 min',
    icon: 'edit',
    iconColor: 'primary',
  },
  {
    id: 'hist-2',
    actor: MOCK_USERS[1] ?? MOCK_ME,
    action: 'Se unió como',
    detail: 'Colaboradora',
    timestamp: 'Hoy, 10:45 AM',
    icon: 'person_add',
    iconColor: 'secondary',
  },
  {
    id: 'hist-3',
    actor: MOCK_ME,
    action: 'Tarea creada en',
    detail: 'Equipo Alpha',
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
