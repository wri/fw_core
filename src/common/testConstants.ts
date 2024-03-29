const ROLES = {
  USER: {
    id: '6266c6f798340a001ad51caa',
    _id: '6266c6f798340a001ad51caa',
    email: 'edward@3sidedcube.com',
    name: 'Edward Martin',
    provider: 'local',
    role: 'USER',
    extraUserData: {
      apps: [],
    },
    createdAt: '2022-04-25T16:06:15.000Z',
    updatedAt: '2022-08-25T13:20:24.000Z',
  },
  MANAGER: {
    id: '1a10d7c6e0a37126611fd7a8',
    role: 'MANAGER',
    name: 'Manager Name',
    provider: 'local',
    email: 'user@control-tower.org',
    extraUserData: {
      apps: [
        'rw',
        'gfw',
        'gfw-climate',
        'prep',
        'aqueduct',
        'forest-atlas',
        'data4sdgs',
      ],
    },
  },
  ADMIN: {
    id: '1a10d7c6e0a37126611fd7a9',
    role: 'ADMIN',
    name: 'Admin Name',
    provider: 'local',
    email: 'user@control-tower.org',
    extraUserData: {
      apps: [
        'rw',
        'gfw',
        'gfw-climate',
        'prep',
        'aqueduct',
        'forest-atlas',
        'data4sdgs',
      ],
    },
  },
};

export default ROLES;
