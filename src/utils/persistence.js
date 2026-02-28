const DB_NAME = 'layerish'
const STORE_NAME = 'sessions'
const SESSION_KEY = 'latest'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, action) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
    tx.onabort = () => db.close()
  })
}

export async function saveSession(data) {
  const record = { id: SESSION_KEY, data, updatedAt: Date.now() }
  await withStore('readwrite', (store) => store.put(record))
}

export async function loadSession() {
  const record = await withStore('readonly', (store) =>
    store.get(SESSION_KEY)
  )
  return record?.data ?? null
}

export function createImageLoader() {
  const cache = new Map()
  return (src) => {
    if (!src) return Promise.resolve(null)
    if (cache.has(src)) return cache.get(src)
    const promise = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
    cache.set(src, promise)
    return promise
  }
}

export function serializeMaskData(maskData) {
  if (!maskData) return null
  return {
    width: maskData.width,
    height: maskData.height,
    data: new Uint8ClampedArray(maskData.data),
  }
}

export function serializeSnapshot(snapshot) {
  if (!snapshot) return null
  return {
    activeLayerId: snapshot.activeLayerId ?? null,
    zoom: snapshot.zoom ?? 1,
    pan: snapshot.pan ? { ...snapshot.pan } : { x: 0, y: 0 },
    moveLayerId: snapshot.moveLayerId ?? null,
    layers: (snapshot.layers || []).map((layer) => ({
      id: layer.id,
      name: layer.name,
      imgSrc: layer.img?.src ?? null,
      width: layer.width,
      height: layer.height,
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      blendMode: layer.blendMode,
      blendOpacity: layer.blendOpacity,
      hasSelection: layer.hasSelection,
      visible: layer.visible,
      maskData: serializeMaskData(layer.maskData),
    })),
  }
}

export function captureSnapshotFromState(state) {
  return {
    layers: state.layers.map((layer) => {
      const maskCtx = layer.mask.getContext('2d')
      const maskData = maskCtx.getImageData(
        0,
        0,
        layer.mask.width,
        layer.mask.height
      )
      return {
        id: layer.id,
        name: layer.name,
        img: layer.img,
        width: layer.width,
        height: layer.height,
        x: layer.x,
        y: layer.y,
        scale: layer.scale,
        blendMode: layer.blendMode,
        blendOpacity: layer.blendOpacity,
        hasSelection: layer.hasSelection,
        visible: layer.visible,
        maskData,
      }
    }),
    activeLayerId: state.activeLayerId,
    zoom: state.zoom,
    pan: { ...state.pan },
    moveLayerId: state.moveLayerId,
  }
}

export function serializeState(state) {
  const current = serializeSnapshot(captureSnapshotFromState(state))
  const history = (state.history || []).map(serializeSnapshot)
  const future = (state.future || []).map(serializeSnapshot)

  return {
    version: DB_VERSION,
    savedAt: Date.now(),
    current,
    history,
    future,
    settings: {
      brushSize: state.brushSize,
      maskFeatherEnabled: state.maskFeatherEnabled,
      maskFeatherSize: state.maskFeatherSize,
      showFinalComposite: state.showFinalComposite,
      isLayersOpen: state.isLayersOpen,
      hasUserToggledLayers: state.hasUserToggledLayers,
      viewportSize: { ...state.viewportSize },
      hasViewport: state.hasViewport,
      zoom: state.zoom,
      pan: { ...state.pan },
      activeLayerId: state.activeLayerId,
      moveLayerId: state.moveLayerId,
    },
  }
}