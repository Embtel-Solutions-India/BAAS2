// Any button can open the Rush Service popup with: openRushModal()
export const RUSH_MODAL_EVENT = 'open-rush-modal';
export const openRushModal = () => window.dispatchEvent(new Event(RUSH_MODAL_EVENT));
