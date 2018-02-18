const icons = {
  dashboard: 'dashboard',
  help: 'help_outline',
  about: 'info_outline',
  home: 'home',
  item: 'label',
  menu: 'menu',
  options: 'more_vert',
  logout: 'exit_to_app',
  login: 'account_circle',
  register: 'create',
  cancel: 'clear',
  revert: 'undo',
  save: 'send',
  add: 'add',
  edit: 'create',
  project: 'layers',
  delete: 'delete',
  folder_open: 'keyboard_arrow_right',
  view: 'visibility',
  actions: 'more_vert',
  folder: 'folder',
  folderadd: 'create_new_folder',
  folderopen: 'folder_open',
  settings: 'settings',
  search: 'search',
  users: 'people',
  video: 'videocam',
  back: 'arrow_back',
  forward: 'arrow_forward',
  time: 'access_time',
  star: 'star',
  disk: 'storage',
  root: 'apps',
  up: 'arrow_upward'
}

const config = {
  title:'',
  basepath:'/app',
  // the default state for the value reducer
  initialState: {
    value: {
      initialized: false,
      menuOpen: false
    }
  },  
  menu: {
    normal: () => ([
      ['/help', 'Help', icons.help],
      ['/about', 'About', icons.about]
    ])
  },
  icons
}

export default config