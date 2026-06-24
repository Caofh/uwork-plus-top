export interface MenuItem {
  index: string
  title: string
  path?: string
  icon?: string
  customIcon?: any
  disabled?: boolean
  requireLogin?: boolean
  minVersion?: string
  children?: MenuItem[]
}

export const menuData: MenuItem[] = [
  {
    index: '1',
    title: 'Navigator One',
    icon: 'Location',
    children: [
      {
        index: '1-1',
        title: 'item one',
        children: [
          {
            index: '1-1-1',
            title: 'Navigator Two-1-1-1',
            icon: 'IconMenu',
            children: [],
          },
          {
            index: '1-1-2',
            title: 'Navigator Three-1-1-2',
            icon: 'Document',
            disabled: true,
            children: [],
          },
        ],
      },
      {
        index: '1-2',
        title: 'item two',
        children: [],
      },
      {
        index: '1-3',
        title: 'item three',
        children: [],
      },
      {
        index: '1-4',
        title: 'item four',
        children: [
          {
            index: '1-4-1',
            title: 'item one',
            children: [],
          },
        ],
      },
    ],
  },
  {
    index: '2',
    title: 'Navigator Two',
    icon: 'IconMenu',
    children: [],
  },
  {
    index: '3',
    title: 'Navigator Three',
    icon: 'Document',
    disabled: true,
    children: [],
  },
  {
    index: '4',
    title: 'Navigator Four',
    icon: 'Setting',
    children: [],
  },
]
