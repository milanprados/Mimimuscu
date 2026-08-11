/**
 * Ajustements fins du repos éditorial.
 * Ne touche ni au moteur, ni aux IDs, ni aux handlers.
 */
export function installWorkoutRestTweaks() {
  document.getElementById("mimi-workout-rest-tweaks")?.remove();

  const style = document.createElement("style");
  style.id = "mimi-workout-rest-tweaks";
  style.textContent = `
    .rest-editorial-next-row{
      width:min(100%,360px)!important;
      margin:0 auto!important;
      grid-template-columns:84px minmax(0,1fr)!important;
      gap:18px!important;
      justify-content:center!important;
      align-items:center!important;
    }

    .rest-editorial-next-copy{
      min-width:0!important;
      display:flex!important;
      flex-direction:column!important;
      justify-content:center!important;
    }

    .rest-editorial-next-copy .rest-editorial-kicker{
      margin:0 0 8px!important;
      padding:0!important;
      align-self:flex-start!important;
    }

    .focus.rest-editorial .recovery-orbit{
      justify-self:center!important;
      align-self:center!important;
    }

    .rest-editorial-how-scroll{
      padding-bottom:10px!important;
    }

    .rest-editorial-guide-separator{
      height:1px!important;
      margin:8px 0 4px!important;
      background:#dfe7e3!important;
    }

    .rest-editorial-how-scroll .rest-editorial-guide{
      display:block!important;
      width:max-content!important;
      margin:0 0 0 auto!important;
      padding:10px 2px 6px!important;
      background:transparent!important;
      border:0!important;
      color:#315f7d!important;
      font-size:9px!important;
      font-weight:850!important;
    }

    @media(max-width:390px){
      .rest-editorial-next-row{
        width:100%!important;
        grid-template-columns:78px minmax(0,1fr)!important;
        gap:15px!important;
      }
    }
  `;
  document.head.appendChild(style);

  const focusContent = document.getElementById("focusContent");
  if (!focusContent) return;

  function refineRest() {
    const screen = focusContent.querySelector(".recovery-screen.editorial-rest");
    if (!screen || screen.dataset.restTweaks === "1") return;

    const nextCopy = screen.querySelector(".rest-editorial-next-copy");
    const kicker = screen.querySelector(".rest-editorial-kicker");

    // Aligne "PROCHAIN EXERCICE" exactement avec le nom de l'exercice.
    if (nextCopy && kicker) {
      nextCopy.prepend(kicker);
    }

    const scroll = screen.querySelector(".rest-editorial-how-scroll");
    const guide = screen.querySelector(".rest-editorial-guide");

    // Le lien redevient la fin naturelle du contenu scrollable.
    if (scroll && guide) {
      const separator = document.createElement("div");
      separator.className = "rest-editorial-guide-separator";
      scroll.appendChild(separator);
      scroll.appendChild(guide);
    }

    screen.dataset.restTweaks = "1";
  }

  const observer = new MutationObserver(refineRest);
  observer.observe(focusContent, {childList:true, subtree:true});
  refineRest();
}
