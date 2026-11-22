import Swal from 'sweetalert2';

/*
 * One place for every popup in the app, using SweetAlert2 and the CampusFest colours.
 *
 *   await confirmAction('Delete this class?')        -> true or false (replaces window.confirm)
 *   showSuccess('Class added.')                      -> small message in the corner, goes away by itself
 *   showError('Could not save. Please try again.')   -> popup the person must close
 *   showInfo('There are no new entries to submit.')  -> popup the person must close
 *   showAlert('any message')                         -> picks success / error / info from the words (replaces alert)
 *
 * Unlike the browser's alert(), these do not freeze the page: the code after showAlert(...)
 * keeps running straight away. Use "await" only with confirmAction.
 */

const BRAND = '#0B3F46';
const DANGER = '#D6336C';

const modal = Swal.mixin({
  confirmButtonColor: BRAND,
  cancelButtonColor: '#64748B',
  heightAuto: false, // stops the page jumping when a popup opens
  customClass: { popup: 'fest-body rounded-2xl', title: 'fest-display' },
});

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: { popup: 'fest-body' },
});

// Questions that delete or undo something get a red button, and "Cancel" is focused first
export const isDangerous = (text) => /\b(delete|remove|reject|replace|undo)\b/i.test(String(text || ''));

// Decide the look of a plain message from its words
export const inferType = (message) => {
  const m = String(message || '');
  if (/\b(could not|cannot|can't|failed|error|unable|invalid|went wrong)\b/i.test(m)) return 'error';
  if (/\b(success|successfully|saved|approved|added|forwarded|removed|updated|assigned|created|deleted)\b/i.test(m)) return 'success';
  return 'info';
};

export const showSuccess = (text, title) =>
  toast.fire({ icon: 'success', title: title || String(text), text: title ? String(text) : undefined });

export const showError = (text, title = 'Something went wrong') =>
  modal.fire({ icon: 'error', title, text: String(text), confirmButtonText: 'OK' });

export const showInfo = (text, title = 'Please note') =>
  modal.fire({ icon: 'info', title, text: String(text), confirmButtonText: 'OK' });

export const showAlert = (message, title) => {
  const type = inferType(message);
  if (type === 'success') return showSuccess(message, title);
  if (type === 'error') return showError(message, title);
  return showInfo(message, title);
};

/*
 * confirmAction('Delete this class?')
 * confirmAction({ title: 'Publish the list?', text: 'Coordinators will see it.', confirmText: 'Publish' })
 */
export async function confirmAction(options) {
  const o = typeof options === 'string' ? { text: options } : options || {};
  const danger = o.danger ?? isDangerous(`${o.title || ''} ${o.text || ''}`);
  const result = await modal.fire({
    icon: danger ? 'warning' : 'question',
    title: o.title || 'Are you sure?',
    text: o.text,
    showCancelButton: true,
    confirmButtonText: o.confirmText || (danger ? 'Yes, continue' : 'Yes'),
    cancelButtonText: o.cancelText || 'Cancel',
    confirmButtonColor: danger ? DANGER : BRAND,
    reverseButtons: true,
    focusCancel: danger,
  });
  return result.isConfirmed;
}