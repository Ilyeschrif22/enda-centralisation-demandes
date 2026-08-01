<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Mot de passe oublié — Tempus</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
</head>
<body>

<div class="split-container">

    <!-- ═══════════════════════════════════
         LEFT PANEL — Brand & steps
    ═══════════════════════════════════ -->
    <div class="left-panel">

        <!-- Logo -->
        <div class="brand">
            <img src="${url.resourcesPath}/img/enda-logo.jpg" class="brand-logo-img" alt="Enda Tamweel Logo">
            <div class="brand-text">
                <span class="brand-app">TEMPUS</span>
            </div>
        </div>

        <!-- Headline -->
        <div class="left-copy">
            <h1>Réinitialisez votre<br/>mot de passe</h1>
            <p>Suivez les étapes pour récupérer votre accès.</p>
        </div>

        <!-- Steps -->
        <ul class="steps-list">
            <li>
                <span class="step-num">1</span>
                <span>Entrez votre adresse email</span>
            </li>
            <li>
                <span class="step-num">2</span>
                <span>Consultez votre boîte mail pour le lien de réinitialisation</span>
            </li>
            <li>
                <span class="step-num">3</span>
                <span>Créez un nouveau mot de passe sécurisé</span>
            </li>
        </ul>

        <!-- Footer -->
        <div class="left-foot">
            © 2026 eNDa tamweel — Tous droits réservés.
        </div>

    </div>

    <!-- ═══════════════════════════════════
         RIGHT PANEL — Reset form
    ═══════════════════════════════════ -->
    <div class="right-panel">

        <!-- Icon + title -->
        <div class="form-head">
            <div class="form-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="#de0065" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>
            <h2>Mot de passe oublié ?</h2>
            <p>Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
        </div>

        <!-- Keycloak message -->
        <#if message?has_content>
            <div class="kc-alert kc-alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
            </div>
        </#if>

        <!-- Info box -->
        <div class="info-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                 fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Le lien de réinitialisation expirera dans <strong>15 minutes</strong>. Vérifiez aussi vos spams.</span>
        </div>

        <!-- Reset form -->
        <form id="kc-reset-password-form"
              action="${url.loginAction}"
              method="post">

            <div class="field-group">
                <label for="username">EMAIL</label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    tabindex="1"
                    autofocus
                    autocomplete="off"
                    placeholder="nom.prenom@enda.com"
                    value=""
                />
            </div>

            <button type="submit" tabindex="2" class="submit-btn">
                ✉&nbsp; ENVOYER LE LIEN
            </button>

        </form>

        <div class="back-link">
            <span>←</span>
            <a href="${url.loginUrl}" tabindex="3">Retour à la connexion</a>
        </div>

        <div class="right-foot">
            © 2026 eNDa tamweel — Tous droits réservés.
        </div>

    </div><!-- /right-panel -->

</div><!-- /split-container -->

</body>
</html>
