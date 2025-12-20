import { initFooter, initSidebarToggle, onToggleSidebar } from "./lib.js";

window.onToggleSidebar = onToggleSidebar;
window.toggleDraggable = initSidebarToggle();
window.footerDraggable = initFooter();
