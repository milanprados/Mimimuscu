/**
 * Mimi Muscu — couche de présentation de la séance.
 *
 * On garde les éléments/IDs créés par workout.js et on les réorganise dans le DOM.
 * Les listeners du moteur restent donc attachés aux vrais boutons et au vrai timer.
 */
export function installWorkoutTheme() {
  document.getElementById("mimi-workout-theme")?.remove();

  const style = document.createElement("style");
  style.id = "mimi-workout-theme";
  style.textContent = `
    /* ---------------------------------------------------------------------
       Focus / séance — langage visuel commun
       --------------------------------------------------------------------- */
    .focus{
      background:#f7f5ef!important;
      color:#153f67!important;
    }
    .focus-head button{
      background:rgba(255,253,250,.84)!important;
      border:1px solid rgba(21,63,103,.10)!important;
      color:#153f67!important;
      box-shadow:0 6px 18px rgba(21,63,103,.07)!important;
      backdrop-filter:blur(12px)!important;
    }
    .focus-center small{color:#718591!important}
    .focus-center strong{color:#153f67!important}
    .focus-center em{color:#789b8f!important}
    .focus-progress{background:#dde7e3!important}
    .focus-progress span{background:#153f67!important}

    /* ---------------------------------------------------------------------
       REPOS — structure reprise de la preview validée
       --------------------------------------------------------------------- */
    .focus.rest-editorial{
      padding:0!important;
      overflow:hidden!important;
      background:#f7f5ef!important;
    }
    .focus.rest-editorial .focus-head{
      position:absolute!important;
      z-index:30!important;
      top:calc(8px + env(safe-area-inset-top))!important;
      left:14px!important;
      right:14px!important;
      height:44px!important;
      display:grid!important;
      grid-template-columns:44px 1fr 44px!important;
      pointer-events:none!important;
    }
    .focus.rest-editorial .focus-head button{
      width:42px!important;
      height:42px!important;
      border-radius:50%!important;
      pointer-events:auto!important;
      background:rgba(255,253,250,.74)!important;
      border:1px solid rgba(255,255,255,.72)!important;
      box-shadow:0 7px 24px rgba(18,56,95,.10)!important;
    }
    .focus.rest-editorial .focus-center{
      align-self:center!important;
      justify-self:center!important;
      display:flex!important;
      align-items:baseline!important;
      justify-content:center!important;
      gap:6px!important;
      min-width:0!important;
      padding:6px 10px!important;
      border-radius:999px!important;
      background:rgba(255,253,250,.60)!important;
      border:1px solid rgba(255,255,255,.62)!important;
      backdrop-filter:blur(12px)!important;
      pointer-events:none!important;
      white-space:nowrap!important;
    }
    .focus.rest-editorial .focus-center small,
    .focus.rest-editorial .focus-center strong,
    .focus.rest-editorial .focus-center em{
      display:inline!important;
      margin:0!important;
      line-height:1!important;
      font-style:normal!important;
    }
    .focus.rest-editorial .focus-center small{
      color:#153f67!important;
      font-size:8px!important;
      font-weight:950!important;
      letter-spacing:.12em!important;
    }
    .focus.rest-editorial .focus-center strong{
      color:#153f67!important;
      font-size:9px!important;
      font-weight:850!important;
    }
    .focus.rest-editorial .focus-center em{
      color:#718591!important;
      font-size:8px!important;
    }
    .focus.rest-editorial .focus-progress{display:none!important}
    .focus.rest-editorial .focus-content{
      flex:1!important;
      min-height:0!important;
      height:100%!important;
      overflow:hidden!important;
    }

    .recovery-screen.editorial-rest{
      position:relative!important;
      width:100%!important;
      height:100dvh!important;
      min-height:100%!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
      justify-content:flex-start!important;
      gap:0!important;
      padding:0 16px calc(78px + env(safe-area-inset-bottom))!important;
      overflow:hidden!important;
      background:#f7f5ef!important;
      color:#153f67!important;
    }

    .rest-editorial-hero{
      position:relative!important;
      flex:0 0 min(34dvh,300px)!important;
      height:min(34dvh,300px)!important;
      margin:0 -16px 0!important;
      overflow:hidden!important;
      background:
        radial-gradient(circle at 72% 34%,rgba(120,155,143,.30),transparent 24%),
        radial-gradient(circle at 30% 45%,rgba(111,158,184,.22),transparent 26%),
        linear-gradient(145deg,#e7f1f4 0%,#edf2e9 58%,#f3ebdf 100%)!important;
    }
    .rest-editorial-hero img{
      position:absolute!important;
      inset:12% 8% 7%!important;
      width:84%!important;
      height:81%!important;
      object-fit:contain!important;
      object-position:center!important;
      opacity:.96!important;
      filter:saturate(.82) contrast(.96)!important;
      z-index:2!important;
    }
    .rest-editorial-hero.placeholder::before{
      content:"ILLUSTRATION";
      position:absolute!important;
      inset:0!important;
      display:grid!important;
      place-items:center!important;
      color:#809796!important;
      font-size:9px!important;
      font-weight:900!important;
      letter-spacing:.18em!important;
      z-index:2!important;
    }
    .rest-editorial-hero::after{
      content:"";
      position:absolute!important;
      z-index:4!important;
      left:0!important;right:0!important;bottom:-1px!important;
      height:38%!important;
      background:linear-gradient(transparent,#f7f5ef 94%)!important;
      pointer-events:none!important;
    }

    .rest-editorial-next{
      flex:0 0 auto!important;
      padding:4px 0 12px!important;
    }
    .rest-editorial-kicker{
      margin-bottom:9px!important;
      color:#82918f!important;
      font-size:8px!important;
      font-weight:950!important;
      letter-spacing:.16em!important;
      text-transform:uppercase!important;
    }
    .rest-editorial-next-row{
      display:grid!important;
      grid-template-columns:minmax(72px,1fr) minmax(0,4fr)!important;
      gap:16px!important;
      align-items:center!important;
    }
    .rest-editorial-next-copy{min-width:0!important}
    .rest-editorial-next-copy h3{
      margin:0!important;
      color:#153f67!important;
      font-family:Georgia,"Times New Roman",serif!important;
      font-size:25px!important;
      line-height:1.02!important;
      letter-spacing:-.035em!important;
      font-weight:700!important;
    }
    .rest-editorial-next-copy strong{
      display:block!important;
      margin-top:5px!important;
      color:#789b8f!important;
      font-size:12px!important;
      font-weight:900!important;
    }
    .rest-editorial-next-copy p{
      margin:7px 0 0!important;
      color:#607783!important;
      font-size:10px!important;
      line-height:1.38!important;
      display:-webkit-box!important;
      -webkit-line-clamp:2!important;
      -webkit-box-orient:vertical!important;
      overflow:hidden!important;
    }

    /* Timer petit, sobre, centré à gauche du prochain exercice. */
    .focus.rest-editorial .recovery-orbit{
      --rest-ring:#1d5c91!important;
      --rest-track:#d7e5ed!important;
      width:78px!important;
      height:78px!important;
      flex:0 0 78px!important;
      justify-self:center!important;
      margin:0!important;
      background:conic-gradient(from -90deg,var(--rest-ring) var(--rest-progress),var(--rest-track) 0)!important;
      border:0!important;
      box-shadow:none!important;
    }
    .focus.rest-editorial .recovery-orbit::before{
      inset:5px!important;
      background:#f7f5ef!important;
    }
    .focus.rest-editorial .recovery-digit-svg text{
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif!important;
      font-size:40px!important;
      font-weight:900!important;
      fill:#1d5c91!important;
    }
    .focus.rest-editorial .recovery-screen.preparing .recovery-orbit{
      --rest-ring:#ef8128!important;
    }
    .focus.rest-editorial .recovery-screen.preparing .recovery-digit-svg text{
      fill:#ef8128!important;
    }
    .focus.rest-editorial .recovery-label,
    .focus.rest-editorial #restCountdownNote{
      position:absolute!important;
      width:1px!important;
      height:1px!important;
      overflow:hidden!important;
      clip:rect(0 0 0 0)!important;
      clip-path:inset(50%)!important;
      white-space:nowrap!important;
    }

    /* Comment faire : grande carte, contenu scrollable, lien discret en bas. */
    .rest-editorial-how{
      flex:1 1 auto!important;
      min-height:0!important;
      display:grid!important;
      grid-template-rows:auto minmax(0,1fr) auto!important;
      background:rgba(255,255,255,.66)!important;
      border:1px solid #dbe5df!important;
      border-radius:21px!important;
      overflow:hidden!important;
      box-shadow:none!important;
    }
    .rest-editorial-how-head{
      padding:13px 14px 10px!important;
      color:#153f67!important;
      font-size:9px!important;
      font-weight:950!important;
      letter-spacing:.14em!important;
      text-transform:uppercase!important;
    }
    .rest-editorial-how-scroll{
      min-height:0!important;
      overflow:auto!important;
      overscroll-behavior:contain!important;
      scrollbar-width:none!important;
      padding:0 14px 5px!important;
    }
    .rest-editorial-how-scroll::-webkit-scrollbar{display:none!important}
    .focus.rest-editorial .rest-prep{
      width:100%!important;
      display:flex!important;
      flex-direction:column!important;
      gap:0!important;
    }
    .focus.rest-editorial .rest-prep section{
      width:100%!important;
      padding:10px 0!important;
      background:transparent!important;
      border:0!important;
      border-top:1px solid #e3e9e5!important;
      border-radius:0!important;
    }
    .focus.rest-editorial .rest-prep section:first-child{border-top:0!important;padding-top:4px!important}
    .focus.rest-editorial .rest-prep small{
      display:block!important;
      color:#789b8f!important;
      font-size:8px!important;
      font-weight:950!important;
      letter-spacing:.11em!important;
    }
    .focus.rest-editorial .rest-prep ul{
      list-style:none!important;
      margin:7px 0 0!important;
      padding:0!important;
      display:grid!important;
      gap:6px!important;
    }
    .focus.rest-editorial .rest-prep li{
      position:relative!important;
      padding-left:14px!important;
      color:#4f6876!important;
      font-size:10px!important;
      line-height:1.42!important;
    }
    .focus.rest-editorial .rest-prep li::before{
      content:"•"!important;
      position:absolute!important;
      left:1px!important;
      top:0!important;
      color:#789b8f!important;
      font-weight:950!important;
    }
    .rest-editorial-guide{
      justify-self:end!important;
      margin:0 10px 9px!important;
      padding:8px 5px!important;
      background:transparent!important;
      border:0!important;
      color:#315f7d!important;
      font-size:9px!important;
      font-weight:850!important;
    }

    .focus.rest-editorial #skipRest{
      position:absolute!important;
      z-index:20!important;
      left:16px!important;
      right:16px!important;
      bottom:calc(10px + env(safe-area-inset-bottom))!important;
      width:auto!important;
      min-height:50px!important;
      margin:0!important;
      border:1px solid #d8e3df!important;
      border-radius:16px!important;
      background:rgba(255,253,250,.92)!important;
      color:#526d7a!important;
      box-shadow:0 8px 24px rgba(21,63,103,.07)!important;
    }

    @media(max-height:760px){
      .rest-editorial-hero{
        flex-basis:min(29dvh,220px)!important;
        height:min(29dvh,220px)!important;
      }
      .rest-editorial-next{padding-top:0!important;padding-bottom:8px!important}
      .rest-editorial-next-copy h3{font-size:21px!important}
      .rest-editorial-next-copy p{margin-top:4px!important;font-size:9px!important}
      .focus.rest-editorial .recovery-orbit{width:68px!important;height:68px!important;flex-basis:68px!important}
      .focus.rest-editorial .recovery-digit-svg text{font-size:38px!important}
      .rest-editorial-how-head{padding-top:10px!important;padding-bottom:7px!important}
      .focus.rest-editorial .rest-prep section{padding:7px 0!important}
      .focus.rest-editorial .rest-prep li{font-size:9px!important;line-height:1.34!important}
    }
  `;
  document.head.appendChild(style);

  const focus = document.getElementById("focus");
  const content = document.getElementById("focusContent");
  if (!focus || !content) return;

  function makeElement(tag, className, text = "") {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function transformRestScreen(screen) {
    if (!screen || screen.dataset.editorialRest === "1") return;
    screen.dataset.editorialRest = "1";
    screen.classList.add("editorial-rest");
    focus.classList.add("rest-editorial");

    const orbit = screen.querySelector("#recoveryOrbit");
    const label = screen.querySelector("#recoveryLabel");
    const note = screen.querySelector("#restCountdownNote");
    const skip = screen.querySelector("#skipRest");
    const nextCard = screen.querySelector(".next-card");
    const nextCopy = nextCard?.querySelector(".next-copy");
    const nextVisual = nextCard?.querySelector(".next-visual");
    const prep = screen.querySelector(".rest-prep");
    const guide = screen.querySelector("#restGuide");

    // Header flottant au-dessus du hero.
    const phase = document.getElementById("focusPhase");
    if (phase) phase.textContent = "REPOS";

    const hero = makeElement("div", "rest-editorial-hero");
    const heroImage = nextVisual?.querySelector("img");
    if (heroImage) {
      hero.appendChild(heroImage);
    } else {
      hero.classList.add("placeholder");
    }

    const nextArea = makeElement("section", "rest-editorial-next");
    nextArea.appendChild(makeElement("div", "rest-editorial-kicker", "PROCHAIN EXERCICE"));

    const nextRow = makeElement("div", "rest-editorial-next-row");
    if (orbit) nextRow.appendChild(orbit);

    const copy = makeElement("div", "rest-editorial-next-copy");
    const title = nextCopy?.querySelector("h3")?.textContent || "Fin de séance";
    const target = nextCopy?.querySelector("strong")?.textContent || "";
    const cue = nextCopy?.querySelector("p")?.textContent || "";
    copy.appendChild(makeElement("h3", "", title));
    if (target) copy.appendChild(makeElement("strong", "", target));
    if (cue) copy.appendChild(makeElement("p", "", cue));
    nextRow.appendChild(copy);
    nextArea.appendChild(nextRow);

    const how = makeElement("section", "rest-editorial-how");
    how.appendChild(makeElement("div", "rest-editorial-how-head", "COMMENT FAIRE"));
    const howScroll = makeElement("div", "rest-editorial-how-scroll");
    if (prep) howScroll.appendChild(prep);
    how.appendChild(howScroll);

    if (guide) {
      guide.className = "rest-editorial-guide";
      guide.textContent = "Guide complet →";
      how.appendChild(guide);
    }

    // On garde label/note dans le DOM : workout.js continue à les mettre à jour,
    // mais ils sont visuellement masqués comme dans la preview.
    const preserved = document.createDocumentFragment();
    if (label) preserved.appendChild(label);
    if (note) preserved.appendChild(note);

    screen.replaceChildren(hero, nextArea, how, preserved);
    if (skip) screen.appendChild(skip);
  }

  function syncWorkoutLayout() {
    const rest = content.querySelector(".recovery-screen");
    if (rest) {
      transformRestScreen(rest);
      return;
    }
    focus.classList.remove("rest-editorial");
  }

  const observer = new MutationObserver(syncWorkoutLayout);
  observer.observe(content, {childList:true, subtree:true});
  syncWorkoutLayout();

  // L'ID réel du bouton est closeWorkoutGuide. L'ancien binding utilisait
  // workoutGuideClose : on fait suivre le clic vers le bouton de reprise,
  // qui appelle déjà la fermeture propre du guide côté workout.js.
  document.getElementById("closeWorkoutGuide")?.addEventListener("click", () => {
    document.getElementById("workoutGuideResume")?.click();
  });
}
