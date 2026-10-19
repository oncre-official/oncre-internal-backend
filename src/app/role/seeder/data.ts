const actions = ['create', 'read', 'update', 'delete'] as const;

const resources = ['users', 'merchants', 'permissions', 'recovery', 'cases', 'settings'] as const;

export const permissions = [
  ...resources.flatMap((resource) =>
    actions.map((action) => ({
      name: `${action}-${resource}`,
      description: `Can ${action} ${resource}`,
    })),
  ),
  {
    name: 'view-dashboard',
    description: 'Can view dashboard',
  },
];

const crud = (resource: (typeof resources)[number]) => actions.map((action) => `${action}-${resource}`);

export const roles = [
  {
    name: 'super-admin',
    permissions: permissions.map((permission) => permission.name),
  },
  {
    name: 'admin',
    permissions: [
      ...crud('users'),
      ...crud('merchants'),
      ...crud('permissions'),
      ...crud('cases'),
      ...crud('settings'),
      'read-roles',
      'read-permissions',
      'view-dashboard',
    ],
  },
  {
    name: 'recovery-admin',
    permissions: [...crud('cases'), ...crud('merchants'), 'read-users', 'view-dashboard'],
  },
  {
    name: 'recovery-officer',
    permissions: [...crud('cases'), ...crud('merchants')],
  },
  {
    name: 'merchant',
    permissions: [],
  },
  {
    name: 'customer',
    permissions: [],
  },
];
