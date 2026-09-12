export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Navigate to the sign-in page.
 * Call this from event handlers or effects, not during render.
 */
export const navigateToLogin = () => {
  window.location.href = "/login";
};
