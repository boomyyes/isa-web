// Shared by components/layout/CookieNotice.tsx and the pre-paint script in
// app/layout.tsx. Lives outside the "use client" module so the server layout
// gets the string itself rather than a client reference.
export const COOKIE_NOTICE_KEY = "cookie-notice";

/**
 * Runs in <head> before first paint. Marks <html> when the notice was
 * dismissed before, and the [data-cookie-notice] rule in globals.css hides it
 * from the very first frame.
 */
export const COOKIE_NOTICE_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(COOKIE_NOTICE_KEY)})==="1")document.documentElement.dataset.cookieDismissed=""}catch(e){}`;
