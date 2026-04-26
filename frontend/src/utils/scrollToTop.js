export function scrollToTop(behavior = "smooth") {
  const el = document.querySelector(".app-main-content");
  if (el) {
    el.scrollTo({ top: 0, behavior });
    return;
  }
  window.scrollTo({ top: 0, behavior });
}