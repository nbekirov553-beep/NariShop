// Копия фото товара летит по дуге к иконке корзины в шапке, после чего иконка подпрыгивает.
// Источник — первое фото внутри ближайшего [data-fly-scope]; без фото летит точка от кнопки.
export function flyToCart(trigger: Element) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  if (!target) return;

  const image = trigger.closest("[data-fly-scope]")?.querySelector("img") ?? null;
  const from = (image ?? trigger).getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = image ? Math.min(from.width, from.height, 140) : 18;

  const ghost = document.createElement(image ? "img" : "span");
  if (ghost instanceof HTMLImageElement && image) {
    ghost.src = image.currentSrc || image.src;
    ghost.alt = "";
  }
  ghost.className = "fly-ghost";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });
  document.body.append(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const arc = Math.min(180, Math.abs(dx) * 0.25 + 80);
  const endScale = 20 / size;

  const flight = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - arc}px) scale(0.7) rotate(-14deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(10deg)`, opacity: 0.6 },
    ],
    { duration: 800, easing: "cubic-bezier(0.55, 0, 0.35, 1)" },
  );

  flight.onfinish = () => {
    ghost.remove();
    target.animate(
      [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(1.3) rotate(-10deg)", offset: 0.35 },
        { transform: "scale(0.92) rotate(4deg)", offset: 0.7 },
        { transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  };
  flight.oncancel = () => ghost.remove();
}
