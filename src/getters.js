export const isLoading = state =>  state.kanjiDefs.isLoading || state.kanjiList.isLoading

export const errors = state => _.map(state, s => s ? s.lastError : null).filter(e => e != null)
