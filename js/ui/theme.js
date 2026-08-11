/**
 * Mimi Muscu — Soft Editorial V2
 *
 * Le thème reste piloté depuis le JS : aucun ID métier n'est modifié et
 * aucun handler n'est remplacé. Le markup existant reste la source de vérité.
 */
export function installAppTheme() {
  const oldTheme = document.getElementById("mimi-soft-editorial-theme");
  if (oldTheme) oldTheme.remove();

  const style = document.createElement("style");
  style.id = "mimi-soft-editorial-theme";
  style.textContent = `
    :root{
      --mimi-cream:#f7f5ef;
      --mimi-paper:#fffdfa;
      --mimi-blue:#153f67;
      --mimi-blue-2:#315f7d;
      --mimi-sky:#eaf4f9;
      --mimi-sky-2:#f3f8fb;
      --mimi-green:#789b8f;
      --mimi-green-soft:#eaf2ed;
      --mimi-line:#dce5e1;
      --mimi-muted:#718591;
      --mimi-orange:#eb812e;
      --bg:var(--mimi-cream);
      --surface:var(--mimi-paper);
      --surface-2:var(--mimi-sky);
      --surface-3:var(--mimi-green-soft);
      --line:var(--mimi-line);
      --line-soft:#e8ece8;
      --text:var(--mimi-blue);
      --muted:var(--mimi-muted);
      --acid:var(--mimi-blue);
      --blue:#6f9eb8;
      --green:var(--mimi-green);
      --orange:var(--mimi-orange);
      --red:#c9685e;
      --shadow:0 14px 34px rgba(24,63,91,.07);
    }

    html,body{
      background:var(--mimi-cream)!important;
      color:var(--mimi-blue)!important;
    }
    body{
      margin:0!important;
      background:var(--mimi-cream)!important;
    }
    body::before,body::after{display:none!important}
    button{-webkit-tap-highlight-color:transparent}

    .app-shell{
      max-width:640px!important;
      padding-left:20px!important;
      padding-right:20px!important;
      padding-bottom:112px!important;
    }
    .app-header{
      height:74px!important;
      background:linear-gradient(var(--mimi-cream) 82%,rgba(247,245,239,0))!important;
      backdrop-filter:none!important;
    }
    .brand-wordmark{
      font-family:Georgia,"Times New Roman",serif!important;
      font-size:25px!important;
      line-height:1!important;
      font-weight:700!important;
      letter-spacing:-.045em!important;
      color:var(--mimi-blue)!important;
    }
    .brand-wordmark span{color:var(--mimi-green)!important;font-size:17px!important}
    .level-chip{
      background:rgba(255,255,255,.72)!important;
      border:1px solid var(--mimi-line)!important;
      color:var(--mimi-blue-2)!important;
      box-shadow:none!important;
      padding:8px 11px!important;
    }

    .eyebrow{
      color:#7e928f!important;
      font-size:9px!important;
      letter-spacing:.16em!important;
    }
    .screen-intro{padding:25px 2px 16px!important}
    .screen-intro h1{
      font-family:Georgia,"Times New Roman",serif!important;
      color:var(--mimi-blue)!important;
      font-size:43px!important;
      line-height:.96!important;
      letter-spacing:-.045em!important;
      font-weight:700!important;
      margin:6px 0 8px!important;
    }
    .screen-intro p{color:var(--mimi-muted)!important;font-size:13px!important;line-height:1.45!important}

    /* ACCUEIL — hero visuel volontairement très différent de V32 */
    #sessionTab .home-intro{
      position:relative!important;
      padding:218px 4px 18px!important;
      overflow:visible!important;
    }
    #sessionTab .home-intro::before{
      content:"";
      position:absolute;
      left:0;right:0;top:4px;
      height:188px;
      border-radius:30px;
      border:1px solid #d7e3df;
      background:
        radial-gradient(circle at 76% 28%,rgba(120,155,143,.34) 0 8%,transparent 8.5%),
        radial-gradient(circle at 70% 50%,rgba(21,63,103,.11) 0 23%,transparent 23.5%),
        radial-gradient(circle at 28% 40%,rgba(115,167,195,.25) 0 16%,transparent 16.5%),
        linear-gradient(145deg,#e7f1f4 0%,#eff3ea 54%,#f4eee3 100%);
      box-shadow:0 14px 34px rgba(24,63,91,.05);
    }
    #sessionTab .home-intro::after{
      content:"ILLUSTRATION";
      position:absolute;
      top:92px;left:0;right:0;
      text-align:center;
      color:#839a98;
      font-size:8px;
      font-weight:850;
      letter-spacing:.18em;
    }
    #sessionTab .home-intro h1{font-size:41px!important;max-width:92%!important}

    .today-card{
      background:transparent!important;
      border:0!important;
      border-top:1px solid var(--mimi-line)!important;
      border-bottom:1px solid var(--mimi-line)!important;
      border-radius:0!important;
      box-shadow:none!important;
      padding:17px 2px 16px!important;
      overflow:visible!important;
    }
    .today-card::after{display:none!important}
    .today-top{align-items:flex-end!important}
    .status-pill{
      background:var(--mimi-blue)!important;
      color:white!important;
      border-radius:999px!important;
      padding:7px 10px!important;
      box-shadow:none!important;
    }
    .status-pill.light-day{background:var(--mimi-green-soft)!important;color:#55786c!important}
    .today-duration span{color:#809099!important}
    .today-duration strong{font-family:Georgia,"Times New Roman",serif!important;color:var(--mimi-blue)!important;font-size:20px!important}
    .phase-route{gap:7px!important;margin:17px 0 12px!important}
    .phase-route div{
      background:rgba(255,255,255,.68)!important;
      border:1px solid var(--mimi-line)!important;
      border-radius:15px!important;
      padding:10px!important;
    }
    .phase-route strong{color:var(--mimi-blue)!important;font-size:10px!important}
    .phase-route small{color:#819099!important;font-size:8px!important}
    .phase-dot.warm{background:#8db4c7!important}
    .phase-dot.main{background:var(--mimi-blue)!important}
    .phase-dot.cool{background:var(--mimi-green)!important}
    .today-focus{color:#607786!important;font-size:12px!important}
    .hero-go,.primary-btn{
      background:var(--mimi-blue)!important;
      color:white!important;
      box-shadow:none!important;
      border-radius:16px!important;
    }
    .hero-go{height:56px!important;margin-top:3px!important}
    .hero-go span{background:white!important;color:var(--mimi-blue)!important}
    .hero-edit{color:#647c89!important}

    .calendar-home-card,.cycle-panel,.section-block,.today-done,.coach-note{
      background:rgba(255,255,255,.56)!important;
      border:1px solid var(--mimi-line)!important;
      box-shadow:none!important;
      backdrop-filter:none!important;
      color:var(--mimi-blue)!important;
    }
    .calendar-home-card,.cycle-panel,.section-block,.today-done{border-radius:21px!important}
    .calendar-home-card{background:var(--mimi-sky-2)!important}
    .coach-note{background:var(--mimi-sky)!important;border-color:#d6e7ee!important}
    .coach-icon{background:white!important;color:var(--mimi-blue-2)!important}
    .coach-note p,.today-done p,.section-copy{color:var(--mimi-muted)!important}
    .section-title strong{color:var(--mimi-blue)!important;font-size:15px!important}
    .section-title b,.link-btn{color:var(--mimi-blue-2)!important}
    .compact-btn{background:var(--mimi-sky)!important;border-color:#d5e5eb!important;color:var(--mimi-blue-2)!important}
    .progress-track,.milestone-bar{background:#dfe7e3!important}
    .progress-track span,.milestone-bar div{background:var(--mimi-green)!important}
    .calendar-home-head strong,.calendar-today-row strong,.home-next-row strong{color:var(--mimi-blue)!important}
    .calendar-today-row{border-color:#dfe8e4!important}
    .home-next-row span,.home-next-row em,.calendar-today-row small{color:var(--mimi-muted)!important}
    .calendar-status.planned{background:#e3f1f7!important;color:#397697!important}
    .calendar-status.done{background:#e5efe9!important;color:#55786c!important}
    .calendar-status.rest{background:#eeece6!important;color:#82755f!important}

    /* NAV */
    .tabs{
      height:68px!important;
      background:rgba(250,248,243,.95)!important;
      border:1px solid rgba(21,63,103,.10)!important;
      box-shadow:0 12px 34px rgba(21,63,103,.11)!important;
      backdrop-filter:blur(18px)!important;
      border-radius:23px!important;
    }
    .tabs button{color:#87959b!important}
    .tabs button.active{background:var(--mimi-sky)!important;color:var(--mimi-blue)!important}
    .tabs button.active small{color:var(--mimi-blue)!important}

    /* EXERCICES */
    #exercisesTab .screen-intro{padding-bottom:10px!important}
    .search-panel{background:linear-gradient(var(--mimi-cream) 88%,rgba(247,245,239,0))!important}
    .search-wrap{
      background:rgba(255,255,255,.76)!important;
      border:1px solid var(--mimi-line)!important;
      border-radius:16px!important;
    }
    .search-wrap span{color:#83959c!important}
    .search-wrap input{color:var(--mimi-blue)!important}
    .search-wrap input::placeholder{color:#9aa7aa!important}
    .filter-chip{background:#edf1ef!important;border-color:transparent!important;color:#6f7f86!important}
    .filter-chip.active{background:var(--mimi-blue)!important;border-color:var(--mimi-blue)!important;color:white!important}
    .exercise-list{display:block!important}
    .exercise-card{
      width:100%!important;
      grid-template-columns:82px 1fr!important;
      gap:13px!important;
      background:transparent!important;
      border:0!important;
      border-bottom:1px solid #dfe6e2!important;
      border-radius:0!important;
      color:var(--mimi-blue)!important;
      padding:13px 0!important;
      margin:0!important;
      box-shadow:none!important;
    }
    .exercise-thumb{
      width:82px!important;height:76px!important;
      position:relative!important;
      background:linear-gradient(145deg,#e4edf0,#efece3)!important;
      border-radius:17px!important;
      overflow:hidden!important;
    }
    .exercise-thumb img{display:none!important}
    .exercise-thumb::after{
      content:"○";
      position:absolute;inset:0;
      display:grid;place-items:center;
      color:#9aaca7;font-size:31px;font-weight:200;
    }
    .exercise-copy{padding-top:3px!important}
    .exercise-card strong{
      font-family:Georgia,"Times New Roman",serif!important;
      font-size:22px!important;
      line-height:1.05!important;
      color:var(--mimi-blue)!important;
      font-weight:700!important;
    }
    .exercise-card small{color:var(--mimi-muted)!important;white-space:normal!important;line-height:1.36!important;margin-top:6px!important}
    .exercise-arrow{color:var(--mimi-blue-2)!important;font-size:17px!important}
    .exercise-meta span{background:var(--mimi-green-soft)!important;border:0!important;color:#668577!important;border-radius:999px!important}

    /* PROGRÈS */
    #progressTab .progress-metrics{grid-template-columns:repeat(2,1fr)!important;gap:9px!important}
    #progressTab .progress-metrics .metric{
      min-height:102px!important;
      background:rgba(255,255,255,.58)!important;
      border:1px solid var(--mimi-line)!important;
      box-shadow:none!important;
      border-radius:19px!important;
    }
    #progressTab .progress-metrics .metric:first-child{
      grid-column:1/-1!important;
      min-height:148px!important;
      background:linear-gradient(145deg,#e8f3f7,#f0f3e9)!important;
    }
    #progressTab .progress-metrics .metric:first-child strong{font-size:56px!important}
    .metric span{color:var(--mimi-muted)!important}
    .metric strong{font-family:Georgia,"Times New Roman",serif!important;color:var(--mimi-blue)!important;font-size:31px!important}
    .axis-row,.before-after-card,.record-tile,.profile-body-summary>div,.body-summary>div,.adaptive-target{
      background:rgba(255,255,255,.58)!important;
      border-color:var(--mimi-line)!important;
      color:var(--mimi-blue)!important;
    }
    .axis-head strong,.axis-head b,.before-after-card strong,.record-tile strong,.profile-body-summary strong{color:var(--mimi-blue)!important}
    .axis-head small,.axis-foot,.before-after-card small,.record-tile small,.profile-body-summary small,.profile-body-summary span{color:var(--mimi-muted)!important}
    .axis-track,.goal-track,.xp-track{background:#dfe7e3!important}
    .axis-track span,.goal-track span,.xp-track span{background:var(--mimi-green)!important}
    .mini-chart{background:var(--mimi-sky)!important;border:1px solid #d6e7ee!important;box-shadow:none!important}
    .mini-chart .bar{background:var(--mimi-green)!important}
    .targets-list .row,.history-item{border-color:#e1e7e3!important}
    .targets-list .row strong{color:var(--mimi-blue-2)!important}
    .baseline-chip{background:var(--mimi-sky)!important;color:var(--mimi-blue-2)!important;border-color:#d6e7ee!important}

    /* PROFIL */
    .athlete-card{
      background:linear-gradient(145deg,#e9f3f6,#f2efe7)!important;
      border:1px solid var(--mimi-line)!important;
      color:var(--mimi-blue)!important;
      box-shadow:none!important;
      border-radius:27px!important;
      padding:18px!important;
    }
    .athlete-avatar{background:var(--mimi-blue)!important;color:white!important;box-shadow:none!important}
    .athlete-id h2,.athlete-id strong,.athlete-index strong,.athlete-stats strong{color:var(--mimi-blue)!important}
    .athlete-id>strong,.athlete-level small,.athlete-index span,.athlete-index small,.athlete-stats>div>span{color:var(--mimi-muted)!important}
    .athlete-edit{background:white!important;border:1px solid var(--mimi-line)!important;color:var(--mimi-blue-2)!important}
    .athlete-index{
      background:rgba(255,255,255,.62)!important;
      border:1px solid var(--mimi-line)!important;
      border-radius:20px!important;
    }
    .athlete-index strong{font-family:Georgia,"Times New Roman",serif!important;font-size:49px!important}
    .athlete-stats>div{background:rgba(255,255,255,.62)!important;border:1px solid var(--mimi-line)!important}
    .athlete-index .positive{background:#e6efe9!important;color:#55786c!important}
    .athlete-index .negative{background:#f7e8e5!important;color:#a45b53!important}
    .profile-narrative{background:var(--mimi-sky)!important;border-left-color:var(--mimi-green)!important;color:#58717e!important}
    .adapt-card{background:var(--mimi-green-soft)!important;border-color:#d4e4da!important;color:#52766a!important}
    .adapt-status{color:#52766a!important}.adapt-status span{background:var(--mimi-green)!important;box-shadow:none!important}.adapt-card p{color:#667d74!important}
    .settings-divider span{color:var(--mimi-muted)!important}

    /* MODALES / PLANNER */
    .modal{background:var(--mimi-cream)!important;color:var(--mimi-blue)!important}
    .modal-shell{color:var(--mimi-blue)!important}
    .modal-head{background:linear-gradient(var(--mimi-cream) 82%,rgba(247,245,239,0))!important}
    .modal-head button{background:white!important;border:1px solid var(--mimi-line)!important;color:var(--mimi-blue)!important}
    .modal-head h2{font-family:Georgia,"Times New Roman",serif!important;color:var(--mimi-blue)!important}
    .modal-form,.planner-summary,.planner-row,.custom-editor-row,.picker-card,.guide-section,.family-hero,.variant-card,.base-exercise-card,.muscle-grid>div,.specific-note,.relation-block button{
      background:white!important;
      border-color:var(--mimi-line)!important;
      color:var(--mimi-blue)!important;
    }
    .planner-main strong,.custom-editor-row strong,.picker-card strong,.variant-card strong,.base-exercise-card strong,.muscle-grid strong{color:var(--mimi-blue)!important}
    .planner-main small,.custom-editor-row small,.picker-card small,.variant-card small,.base-exercise-card small,.muscle-grid small{color:var(--mimi-muted)!important}
    .form-grid input,.modal-form input,.modal-form select,textarea,input,select{background:white!important;border-color:var(--mimi-line)!important;color:var(--mimi-blue)!important}
    .soft-btn,.library-actions button,.two-actions button{background:rgba(255,255,255,.68)!important;border-color:var(--mimi-line)!important;color:var(--mimi-blue)!important}

    /* Le mode séance garde son layout et ses timers déjà validés. */
    .focus{--bg:var(--mimi-cream);--text:var(--mimi-blue);--muted:var(--mimi-muted)}

    @media(max-width:480px){
      .app-shell{padding-left:16px!important;padding-right:16px!important}
      .screen-intro h1{font-size:39px!important}
      #sessionTab .home-intro{padding-top:205px!important}
      #sessionTab .home-intro::before{height:176px!important}
      #sessionTab .home-intro::after{top:84px!important}
      .tabs{width:calc(100% - 24px)!important}
    }
  `;

  document.head.appendChild(style);
  document.documentElement.dataset.mimiTheme = "soft-editorial-v2";
}
