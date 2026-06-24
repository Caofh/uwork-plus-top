import { createRouter, createWebHistory } from 'vue-router'

const IframePage = () => import('./views/iframe/index.vue')
const JsonView = () => import('./views/tools/routePage/JsonView.vue')
const ResponseCompare = () => import('./views/tools/routePage/compare/IndexPage.vue')
const WebviewManager = () => import('./views/tools/routePage/WebviewManager.vue')
const AppWebsite = () => import('./views/tools/routePage/AppWebsite.vue')
const Code = () => import('./views/code/index.vue')
const Scaffold = () => import('./views/scaffold/index.vue')
const IntroductionPage = () => import('./views/website/index.vue')
const Demo = () => import('./views/demo/index.vue')
const SwitchProxy = () => import('./views/switchProxy/index.vue')
const SwitchHosts = () => import('./views/switchHosts/index.vue')
const ApiDebug = () => import('./views/apiDebug/index.vue')

const routes = [
  { path: '/tools/jsonView', name: 'JsonView', component: JsonView },
  { path: '/tools/responseCompare', name: 'Snippets', component: ResponseCompare },
  { path: '/tools/webview', name: 'WebviewManager', component: WebviewManager },
  { path: '/tools/appWebsite', name: 'AppWebsite', component: AppWebsite },
  { path: '/tools/code', name: 'ToolsCode', component: Code },
  { path: '/tools/scaffold', name: 'ToolsScaffold', component: Scaffold },
  { path: '/tools/switchProxy', name: 'ToolsSwitchProxy', component: SwitchProxy },
  { path: '/tools/switchHosts', name: 'ToolsSwitchHosts', component: SwitchHosts },
  { path: '/tools/apiDebug', name: 'ToolsApiDebug', component: ApiDebug },
  { path: '/iframe', name: 'Iframe', component: IframePage },
  { path: '/introduction', name: 'Introduction', component: IntroductionPage },
  { path: '/demo', name: 'Demo', component: Demo },
]

const router = createRouter({
  history: createWebHistory('/uworkplus'),
  routes,
})

export default router
