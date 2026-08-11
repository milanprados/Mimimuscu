/**
 * Mimi Muscu — thème Soft Editorial.
 * Le thème est injecté depuis le JS pour rester dans l'architecture UI existante.
 */
export function installAppTheme() {
  document.getElementById("mimi-soft-editorial-theme")?.remove();

  const style = document.createElement("style");
  style.id = "mimi-soft-editorial-theme";
  style.textContent = `
    :root{
      --bg:#f7f5ef;
      --surface:#fffdfa;
      --surface-2:#edf6fb;
      --surface-3:#edf4ef;
      --line:#dbe5df;
      --line-soft:#e6ebe7;
      --text:#12385f;
      --muted:#728693;
      --accent:#1d5c91;
      --green:#7da491;
      --orange:#ef8128;
      --red:#c9675c;
    }

    html,body{background:#f7f5ef!important;color:#12385f!important}
    body{background:#f7f5ef!important}
    .app-shell{max-width:640px!important;padding-left:20px!important;padding-right:20px!important}
    .app-header{background:linear-gradient(#f7f5ef 80%,rgba(247,245,239,0))!important;height:76px!important}
    .brand-wordmark{font-family:Georgia,"Times New Roman",serif!important;font-size:24px!important;color:#12385f!important;letter-spacing:-.04em!important}
    .brand-wordmark span{color:#7da491!important}
    .level-chip{background:rgba(255,255,255,.68)!important;border:1px solid #dbe5df!important;color:#1d5c91!important;box-shadow:none!important}

    .screen-intro{padding-top:28px!important;padding-bottom:16px!important}
    .screen-intro h1{font-family:Georgia,"Times New Roman",serif!important;font-size:42px!important;line-height:.96!important;letter-spacing:-.035em!important;color:#12385f!important;margin:6px 0 9px!important}
    .screen-intro p{color:#728693!important;font-size:14px!important}
    .eyebrow{color:#819298!important;letter-spacing:.14em!important}

    .today-card{background:linear-gradient(145deg,#eef6f8,#f5f3ec)!important;border:1px solid #d9e4e3!important;border-radius:26px!important;box-shadow:none!important;padding:18px!important}
    .today-card:after{background:radial-gradient(circle,rgba(29,92,145,.08),transparent 68%)!important}
    .status-pill{background:#1d5c91!important;color:#fff!important}
    .status-pill.light-day{background:#e2ece7!important;color:#57796d!important}
    .today-duration span,.today-focus{color:#728693!important}
    .today-duration strong{color:#12385f!important}
    .phase-route{gap:7px!important;margin:16px 0 13px!important}
    .phase-route div{background:rgba(255,255,255,.65)!important;border:1px solid #dbe5df!important;border-radius:14px!important}
    .phase-route strong{color:#12385f!important}
    .phase-route small{color:#7d8d94!important}
    .phase-dot.warm{background:#8fb5c6!important}.phase-dot.main{background:#1d5c91!important}.phase-dot.cool{background:#7da491!important}
    .hero-go,.primary-btn{background:#1d5c91!important;color:white!important;box-shadow:none!important}
    .hero-go span{background:white!important;color:#1d5c91!important}
    .hero-edit{color:#607887!important}

    .calendar-home-card,.cycle-panel,.section-block,.today-done,.coach-note{background:rgba(255,255,255,.58)!important;border:1px solid #dbe5df!important;box-shadow:none!important;backdrop-filter:none!important;color:#12385f!important}
    .calendar-home-card,.cycle-panel,.section-block,.today-done{border-radius:22px!important}
    .coach-note{background:#edf6fb!important;border-color:#d7e8ef!important}
    .coach-icon{background:white!important;color:#1d5c91!important}
    .coach-note p,.today-done p,.section-copy{color:#728693!important}
    .section-title strong{color:#12385f!important}
    .section-title b,.link-btn{color:#1d5c91!important}
    .compact-btn{background:#edf6fb!important;border-color:#d7e8ef!important;color:#1d5c91!important}
    .progress-track,.milestone-bar{background:#dfe7e3!important}
    .progress-track span,.milestone-bar div{background:#7da491!important}
    .calendar-home-head strong,.calendar-today-row strong,.home-next-row strong{color:#12385f!important}
    .calendar-today-row{border-color:#e1e7e3!important}
    .home-next-row span,.home-next-row em,.calendar-today-row small{color:#728693!important}
    .calendar-status.planned{background:#e9f4fa!important;color:#39789c!important}.calendar-status.done{background:#e8f1eb!important;color:#557a6d!important}.calendar-status.rest{background:#f0eee8!important;color:#83765f!important}

    .tabs{background:rgba(247,245,239,.94)!important;border:1px solid rgba(18,56,95,.10)!important;box-shadow:0 10px 30px rgba(18,56,95,.08)!important;backdrop-filter:blur(18px)!important}
    .tabs button{color:#85939a!important}.tabs button.active{background:#edf6fb!important;color:#1d5c91!important}.tabs button.active small{color:#1d5c91!important}

    .search-panel{background:linear-gradient(#f7f5ef 86%,rgba(247,245,239,0))!important}
    .search-wrap{background:rgba(255,255,255,.70)!important;border-color:#dbe5df!important}
    .search-wrap span{color:#82939b!important}.search-wrap input{color:#12385f!important}.search-wrap input::placeholder{color:#93a0a5!important}
    .filter-chip{background:#edf1ef!important;border-color:transparent!important;color:#6f7f86!important}
    .filter-chip.active{background:#1d5c91!important;border-color:#1d5c91!important;color:#fff!important}
    .exercise-card{background:transparent!important;border:0!important;border-bottom:1px solid #e1e6e2!important;border-radius:0!important;color:#12385f!important;padding:11px 0!important;margin:0!important;box-shadow:none!important}
    .exercise-thumb{background:linear-gradient(145deg,#e4ecef,#efebe1)!important;border-radius:16px!important}
    .exercise-thumb img{opacity:.15!important}
    .exercise-card strong{font-family:Georgia,"Times New Roman",serif!important;font-size:22px!important;line-height:1.05!important;color:#12385f!important}
    .exercise-card small{color:#728693!important;white-space:normal!important;line-height:1.35!important}
    .exercise-arrow{color:#1d5c91!important}
    .exercise-meta span{background:#edf4ef!important;border:0!important;color:#6f9485!important;border-radius:999px!important}

    .metric{background:#edf6fb!important;border:1px solid #d7e8ef!important;box-shadow:none!important;min-height:104px!important}
    .metric span{color:#728693!important}.metric strong{font-family:Georgia,"Times New Roman",serif!important;color:#12385f!important;font-size:31px!important}
    .axis-row,.before-after-card,.record-tile,.profile-body-summary>div,.body-summary>div,.adaptive-target{background:rgba(255,255,255,.58)!important;border-color:#dbe5df!important;color:#12385f!important}
    .axis-head strong,.axis-head b,.before-after-card strong,.record-tile strong,.profile-body-summary strong{color:#12385f!important}
    .axis-head small,.axis-foot,.before-after-card small,.record-tile small,.profile-body-summary small,.profile-body-summary span{color:#728693!important}
    .axis-track,.goal-track,.xp-track{background:#dfe7e3!important}.axis-track span,.goal-track span,.xp-track span{background:#7da491!important}
    .mini-chart{background:#edf6fb!important;border:1px solid #d7e8ef!important}.mini-chart .bar{background:#7da491!important}
    .targets-list .row,.history-item{border-color:#e1e7e3!important}.targets-list .row strong{color:#1d5c91!important}
    .baseline-chip{background:#edf6fb!important;color:#1d5c91!important;border-color:#d7e8ef!important}

    .athlete-card{background:linear-gradient(145deg,#eef6f8,#f5f3ec)!important;border:1px solid #dbe5df!important;color:#12385f!important;box-shadow:none!important}
    .athlete-avatar{background:#1d5c91!important;color:white!important;box-shadow:none!important}
    .athlete-id h2,.athlete-id strong,.athlete-index strong,.athlete-stats strong{color:#12385f!important}
    .athlete-id>strong,.athlete-level small,.athlete-index span,.athlete-index small,.athlete-stats>div>span{color:#728693!important}
    .athlete-edit{background:white!important;border:1px solid #dbe5df!important;color:#1d5c91!important}
    .athlete-index,.athlete-stats>div{background:rgba(255,255,255,.64)!important;border-color:#dbe5df!important}
    .athlete-index .positive{background:#e6f0e9!important;color:#55796d!important}.athlete-index .negative{background:#f8e8e5!important;color:#a65c54!important}
    .profile-narrative{background:#edf6fb!important;border-left-color:#7da491!important;color:#587180!important}
    .adapt-card{background:#edf4ef!important;border-color:#d5e5da!important;color:#557d6c!important}.adapt-status{color:#557d6c!important}.adapt-status span{background:#7da491!important;box-shadow:none!important}.adapt-card p{color:#6a8076!important}
    .settings-divider span{color:#728693!important}

    .modal{background:#f7f5ef!important;color:#12385f!important}.modal-shell{color:#12385f!important}.modal-head{background:linear-gradient(#f7f5ef 82%,rgba(247,245,239,0))!important}.modal-head button{background:#fff!important;border:1px solid #dbe5df!important;color:#12385f!important}.modal-head h2{font-family:Georgia,"Times New Roman",serif!important;color:#12385f!important}
    .modal-form,.planner-summary,.planner-row,.custom-editor-row,.picker-card,.guide-section,.family-hero,.variant-card,.base-exercise-card,.muscle-grid>div,.specific-note,.relation-block button{background:#fff!important;border-color:#dbe5df!important;color:#12385f!important}
    .planner-main strong,.custom-editor-row strong,.picker-card strong,.variant-card strong,.base-exercise-card strong,.muscle-grid strong{color:#12385f!important}
    .planner-main small,.custom-editor-row small,.picker-card small,.variant-card small,.base-exercise-card small,.muscle-grid small{color:#728693!important}
    .form-grid input,.modal-form input,.modal-form select,textarea,input,select{background:#fff!important;border-color:#dbe5df!important;color:#12385f!important}
    .soft-btn,.library-actions button,.two-actions button{background:rgba(255,255,255,.65)!important;border-color:#dbe5df!important;color:#12385f!important}

    /* Le mode séance conserve sa DA actuelle, sauf les variables de fond communes. */
    .focus{--bg:#f7f5ef;--text:#12385f;--muted:#728693}

    @media(max-width:480px){
      .screen-intro h1{font-size:40px!important}
      .tabs{width:calc(100% - 28px)!important}
    }
  `;

  document.head.appendChild(style);
  document.documentElement.dataset.mimiTheme = "soft-editorial";
}
