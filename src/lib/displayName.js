// The platform account name cannot be edited by the app, so a name saved in the
// app's own profile is used wherever the signed-in person is shown.
let savedName = null;

export function setCachedDisplayName(name) {
  savedName = name || null;
}

export function getDisplayName(fallback) {
  return savedName || fallback || '';
}