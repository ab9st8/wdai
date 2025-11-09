export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

let sidebarOpen = true;

import { createDraggable, spring } from "https://esm.sh/animejs";

function placeDraggable(draggable, storageKey, clamp) {
  const position = localStorage.getItem(storageKey);

  if (position !== null) {
    const parsed = JSON.parse(position);

    // We clamp for safety when changing viewports (completely unrealistic but just in case)
    draggable.x = clamp.x(parsed.x);
    draggable.y = clamp.y(parsed.y);
  }
}

export function initDraggable(
  $target,
  container,
  storageKey,
  clamp,
  $trigger = $target
) {
  const draggable = createDraggable($target, {
    container,
    trigger: $trigger,
    containerFriction: 0.6,
    maxVelocity: 100,
    cursor: {
      onHover: "move",
      onGrab: "move",
    },
    releaseEase: spring({
      stiffness: 6000,
      damping: 75,
    }),
    onSettle: () => {
      const newPosition = {
        x: draggable.x,
        y: draggable.y,
      };

      localStorage.setItem(storageKey, JSON.stringify(newPosition));
    },
  });

  placeDraggable(draggable, storageKey, clamp);

  requestAnimationFrame(() => {
    $target.classList.add("visible");
  });

  return draggable;
}

export const initSidebarToggle = () =>
  initDraggable(
    document.querySelector("#toggle-button-wrapper"),
    document.querySelector("main"),
    "button-position",
    {
      x: (x) => x,
      y: (y) => y,
    },
    document.querySelector("#drag-handle")
  );

export const initFooter = () =>
  initDraggable(
    document.querySelector("footer"),
    document.querySelector("nav"),
    "footer-position",
    {
      x: (x) => x,
      y: (y) => y,
    }
  );

export function onToggleSidebar(footerDraggable) {
  const $sidebar = document.querySelector("nav");
  const $toggleSidebarButton = document.querySelector("#toggle-sidebar-button");

  if (sidebarOpen) {
    $sidebar.style.display = "none";
    $toggleSidebarButton.innerText = "open";
  } else {
    // Make sidebar visible first, then place the footer draggable after layout
    // has settled. Using two requestAnimationFrame ticks ensures reflow has
    // occurred so the draggable placement (which may depend on container
    // geometry) will be correct.
    $sidebar.style.display = "flex";
    $toggleSidebarButton.innerText = "close";
    requestAnimationFrame(() =>
      placeDraggable(footerDraggable, "footer-position", {
        x: (x) => x,
        y: (y) => y,
      })
    );
  }
  document.activeElement.blur();
  sidebarOpen = !sidebarOpen;
}
