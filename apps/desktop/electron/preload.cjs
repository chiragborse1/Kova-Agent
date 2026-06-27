const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('kovaDesktop', {
  getConnection: profile => ipcRenderer.invoke('kova:connection', profile),
  revalidateConnection: () => ipcRenderer.invoke('kova:connection:revalidate'),
  touchBackend: profile => ipcRenderer.invoke('kova:backend:touch', profile),
  getGatewayWsUrl: profile => ipcRenderer.invoke('kova:gateway:ws-url', profile),
  openSessionWindow: (sessionId, opts) => ipcRenderer.invoke('kova:window:openSession', sessionId, opts),
  openNewSessionWindow: () => ipcRenderer.invoke('kova:window:openNewSession'),
  petOverlay: {
    // Main renderer → main process: window lifecycle + drag. `request` is
    // `{ bounds, screen }`; resolves with the screen bounds it actually used.
    open: request => ipcRenderer.invoke('kova:pet-overlay:open', request),
    close: () => ipcRenderer.invoke('kova:pet-overlay:close'),
    setBounds: bounds => ipcRenderer.send('kova:pet-overlay:set-bounds', bounds),
    setIgnoreMouse: ignore => ipcRenderer.send('kova:pet-overlay:ignore-mouse', ignore),
    // Flip the overlay focusable (and focus it) while the composer needs keys.
    setFocusable: focusable => ipcRenderer.send('kova:pet-overlay:set-focusable', focusable),
    // Main renderer → overlay (forwarded by main): push the latest pet state.
    pushState: payload => ipcRenderer.send('kova:pet-overlay:state', payload),
    // Overlay → main renderer (forwarded by main): pop back in / composer submit.
    control: payload => ipcRenderer.send('kova:pet-overlay:control', payload),
    // Overlay subscribes to state pushes.
    onState: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('kova:pet-overlay:state', listener)
      return () => ipcRenderer.removeListener('kova:pet-overlay:state', listener)
    },
    // Main renderer subscribes to overlay control messages.
    onControl: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('kova:pet-overlay:control', listener)
      return () => ipcRenderer.removeListener('kova:pet-overlay:control', listener)
    }
  },
  getBootProgress: () => ipcRenderer.invoke('kova:boot-progress:get'),
  getConnectionConfig: profile => ipcRenderer.invoke('kova:connection-config:get', profile),
  saveConnectionConfig: payload => ipcRenderer.invoke('kova:connection-config:save', payload),
  applyConnectionConfig: payload => ipcRenderer.invoke('kova:connection-config:apply', payload),
  testConnectionConfig: payload => ipcRenderer.invoke('kova:connection-config:test', payload),
  probeConnectionConfig: remoteUrl => ipcRenderer.invoke('kova:connection-config:probe', remoteUrl),
  oauthLoginConnectionConfig: remoteUrl => ipcRenderer.invoke('kova:connection-config:oauth-login', remoteUrl),
  oauthLogoutConnectionConfig: remoteUrl => ipcRenderer.invoke('kova:connection-config:oauth-logout', remoteUrl),
  profile: {
    get: () => ipcRenderer.invoke('kova:profile:get'),
    set: name => ipcRenderer.invoke('kova:profile:set', name)
  },
  api: request => ipcRenderer.invoke('kova:api', request),
  notify: payload => ipcRenderer.invoke('kova:notify', payload),
  requestMicrophoneAccess: () => ipcRenderer.invoke('kova:requestMicrophoneAccess'),
  readFileDataUrl: filePath => ipcRenderer.invoke('kova:readFileDataUrl', filePath),
  readFileText: filePath => ipcRenderer.invoke('kova:readFileText', filePath),
  selectPaths: options => ipcRenderer.invoke('kova:selectPaths', options),
  writeClipboard: text => ipcRenderer.invoke('kova:writeClipboard', text),
  saveImageFromUrl: url => ipcRenderer.invoke('kova:saveImageFromUrl', url),
  saveImageBuffer: (data, ext) => ipcRenderer.invoke('kova:saveImageBuffer', { data, ext }),
  saveClipboardImage: () => ipcRenderer.invoke('kova:saveClipboardImage'),
  getPathForFile: file => {
    try {
      return webUtils.getPathForFile(file) || ''
    } catch {
      return ''
    }
  },
  normalizePreviewTarget: (target, baseDir) => ipcRenderer.invoke('kova:normalizePreviewTarget', target, baseDir),
  watchPreviewFile: url => ipcRenderer.invoke('kova:watchPreviewFile', url),
  stopPreviewFileWatch: id => ipcRenderer.invoke('kova:stopPreviewFileWatch', id),
  setTitleBarTheme: payload => ipcRenderer.send('kova:titlebar-theme', payload),
  setNativeTheme: mode => ipcRenderer.send('kova:native-theme', mode),
  setTranslucency: payload => ipcRenderer.send('kova:translucency', payload),
  setPreviewShortcutActive: active => ipcRenderer.send('kova:previewShortcutActive', Boolean(active)),
  openExternal: url => ipcRenderer.invoke('kova:openExternal', url),
  openPreviewInBrowser: url => ipcRenderer.invoke('kova:openPreviewInBrowser', url),
  fetchLinkTitle: url => ipcRenderer.invoke('kova:fetchLinkTitle', url),
  sanitizeWorkspaceCwd: cwd => ipcRenderer.invoke('kova:workspace:sanitize', cwd),
  settings: {
    getDefaultProjectDir: () => ipcRenderer.invoke('kova:setting:defaultProjectDir:get'),
    setDefaultProjectDir: dir => ipcRenderer.invoke('kova:setting:defaultProjectDir:set', dir),
    pickDefaultProjectDir: () => ipcRenderer.invoke('kova:setting:defaultProjectDir:pick')
  },
  revealLogs: () => ipcRenderer.invoke('kova:logs:reveal'),
  getRecentLogs: () => ipcRenderer.invoke('kova:logs:recent'),
  readDir: dirPath => ipcRenderer.invoke('kova:fs:readDir', dirPath),
  gitRoot: startPath => ipcRenderer.invoke('kova:fs:gitRoot', startPath),
  revealPath: targetPath => ipcRenderer.invoke('kova:fs:reveal', targetPath),
  renamePath: (targetPath, newName) => ipcRenderer.invoke('kova:fs:rename', targetPath, newName),
  writeTextFile: (filePath, content) => ipcRenderer.invoke('kova:fs:writeText', filePath, content),
  trashPath: targetPath => ipcRenderer.invoke('kova:fs:trash', targetPath),
  git: {
    worktreeList: repoPath => ipcRenderer.invoke('kova:git:worktreeList', repoPath),
    worktreeAdd: (repoPath, options) => ipcRenderer.invoke('kova:git:worktreeAdd', repoPath, options),
    worktreeRemove: (repoPath, worktreePath, options) =>
      ipcRenderer.invoke('kova:git:worktreeRemove', repoPath, worktreePath, options),
    branchSwitch: (repoPath, branch) => ipcRenderer.invoke('kova:git:branchSwitch', repoPath, branch),
    branchList: repoPath => ipcRenderer.invoke('kova:git:branchList', repoPath),
    repoStatus: repoPath => ipcRenderer.invoke('kova:git:repoStatus', repoPath),
    fileDiff: (repoPath, filePath) => ipcRenderer.invoke('kova:git:fileDiff', repoPath, filePath),
    scanRepos: (roots, options) => ipcRenderer.invoke('kova:git:scanRepos', roots, options),
    review: {
      list: (repoPath, scope, baseRef) => ipcRenderer.invoke('kova:git:review:list', repoPath, scope, baseRef),
      diff: (repoPath, filePath, scope, baseRef, staged) =>
        ipcRenderer.invoke('kova:git:review:diff', repoPath, filePath, scope, baseRef, staged),
      stage: (repoPath, filePath) => ipcRenderer.invoke('kova:git:review:stage', repoPath, filePath),
      unstage: (repoPath, filePath) => ipcRenderer.invoke('kova:git:review:unstage', repoPath, filePath),
      revert: (repoPath, filePath) => ipcRenderer.invoke('kova:git:review:revert', repoPath, filePath),
      revParse: (repoPath, ref) => ipcRenderer.invoke('kova:git:review:revParse', repoPath, ref),
      commit: (repoPath, message, push) => ipcRenderer.invoke('kova:git:review:commit', repoPath, message, push),
      commitContext: repoPath => ipcRenderer.invoke('kova:git:review:commitContext', repoPath),
      push: repoPath => ipcRenderer.invoke('kova:git:review:push', repoPath),
      shipInfo: repoPath => ipcRenderer.invoke('kova:git:review:shipInfo', repoPath),
      createPr: repoPath => ipcRenderer.invoke('kova:git:review:createPr', repoPath)
    }
  },
  terminal: {
    dispose: id => ipcRenderer.invoke('kova:terminal:dispose', id),
    resize: (id, size) => ipcRenderer.invoke('kova:terminal:resize', id, size),
    start: options => ipcRenderer.invoke('kova:terminal:start', options),
    write: (id, data) => ipcRenderer.invoke('kova:terminal:write', id, data),
    onData: (id, callback) => {
      const channel = `hermes:terminal:${id}:data`
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    onExit: (id, callback) => {
      const channel = `hermes:terminal:${id}:exit`
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    }
  },
  onClosePreviewRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('kova:close-preview-requested', listener)
    return () => ipcRenderer.removeListener('kova:close-preview-requested', listener)
  },
  onOpenUpdatesRequested: callback => {
    const listener = () => callback()
    ipcRenderer.on('kova:open-updates', listener)
    return () => ipcRenderer.removeListener('kova:open-updates', listener)
  },
  onDeepLink: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:deep-link', listener)
    return () => ipcRenderer.removeListener('kova:deep-link', listener)
  },
  signalDeepLinkReady: () => ipcRenderer.invoke('kova:deep-link-ready'),
  onWindowStateChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:window-state-changed', listener)
    return () => ipcRenderer.removeListener('kova:window-state-changed', listener)
  },
  onFocusSession: callback => {
    const listener = (_event, sessionId) => callback(sessionId)
    ipcRenderer.on('kova:focus-session', listener)
    return () => ipcRenderer.removeListener('kova:focus-session', listener)
  },
  onNotificationAction: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:notification-action', listener)
    return () => ipcRenderer.removeListener('kova:notification-action', listener)
  },
  onPreviewFileChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:preview-file-changed', listener)
    return () => ipcRenderer.removeListener('kova:preview-file-changed', listener)
  },
  onBackendExit: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:backend-exit', listener)
    return () => ipcRenderer.removeListener('kova:backend-exit', listener)
  },
  onPowerResume: callback => {
    const listener = () => callback()
    ipcRenderer.on('kova:power-resume', listener)
    return () => ipcRenderer.removeListener('kova:power-resume', listener)
  },
  onBootProgress: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:boot-progress', listener)
    return () => ipcRenderer.removeListener('kova:boot-progress', listener)
  },
  // First-launch bootstrap progress -- emitted by the install.ps1 stage
  // runner in main.cjs (apps/desktop/electron/bootstrap-runner.cjs).
  // Renderer's install overlay subscribes to live events and queries the
  // current snapshot via getBootstrapState() to recover after a devtools
  // reload mid-bootstrap.
  getBootstrapState: () => ipcRenderer.invoke('kova:bootstrap:get'),
  resetBootstrap: () => ipcRenderer.invoke('kova:bootstrap:reset'),
  repairBootstrap: () => ipcRenderer.invoke('kova:bootstrap:repair'),
  cancelBootstrap: () => ipcRenderer.invoke('kova:bootstrap:cancel'),
  onBootstrapEvent: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('kova:bootstrap:event', listener)
    return () => ipcRenderer.removeListener('kova:bootstrap:event', listener)
  },
  getVersion: () => ipcRenderer.invoke('kova:version'),
  getRemoteDisplayReason: () => ipcRenderer.invoke('kova:get-remote-display-reason'),
  uninstall: {
    summary: () => ipcRenderer.invoke('kova:uninstall:summary'),
    run: mode => ipcRenderer.invoke('kova:uninstall:run', { mode })
  },
  updates: {
    check: () => ipcRenderer.invoke('kova:updates:check'),
    apply: opts => ipcRenderer.invoke('kova:updates:apply', opts),
    getBranch: () => ipcRenderer.invoke('kova:updates:branch:get'),
    setBranch: name => ipcRenderer.invoke('kova:updates:branch:set', name),
    onProgress: callback => {
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('kova:updates:progress', listener)
      return () => ipcRenderer.removeListener('kova:updates:progress', listener)
    }
  },
  themes: {
    fetchMarketplace: id => ipcRenderer.invoke('kova:vscode-theme:fetch', id),
    searchMarketplace: query => ipcRenderer.invoke('kova:vscode-theme:search', query)
  }
})
