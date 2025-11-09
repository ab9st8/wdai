import { createDraggable, spring } from "https://esm.sh/animejs";

function placeDraggable(draggable, storageKey) {
  const position = localStorage.getItem(storageKey);

  if (position !== null) {
    const parsed = JSON.parse(position);

    draggable.x = parsed.x;
    draggable.y = parsed.y;
  }
}

export function initDraggable(
  $target,
  container,
  storageKey,
  $trigger = $target,
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

  placeDraggable(draggable, storageKey);

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
    document.querySelector("#drag-handle"),
  );

export const initFooter = () =>
  initDraggable(
    document.querySelector("footer"),
    document.querySelector("nav"),
    "footer-position",
  );

export function onToggleSidebar(footerDraggable) {
  const $sidebar = document.querySelector("nav");
  const $toggleSidebarButton = document.querySelector("#toggle-sidebar-button");

  if (sidebarOpen) {
    $sidebar.style.display = "none";
    $toggleSidebarButton.innerText = "open";
  } else {
    $sidebar.style.display = "flex";
    $toggleSidebarButton.innerText = "close";
    requestAnimationFrame(() =>
      placeDraggable(footerDraggable, "footer-position"),
    );
  }
  document.activeElement.blur();
  sidebarOpen = !sidebarOpen;
}
