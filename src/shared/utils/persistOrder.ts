/** Persist order_index for a reordered list. Call after SortableList onReorder. */
export function persistOrder<T extends { id: string }>(
  items: T[],
  updateLocal: (id: string, data: any) => void,
  updateRemote: (id: string, data: any) => Promise<void>,
) {
  items.forEach((item, i) => {
    updateLocal(item.id, { order_index: i })
    updateRemote(item.id, { order_index: i }).catch(() => {})
  })
}
