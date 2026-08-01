<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Connexion — Centralisation des demandes Enda Tamweel</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
</head>
<body>

<div class="split-container">

    <div class="left-panel">

        <div class="brand">
          
        </div>

        <div class="left-copy">
            <h1>Centralisez toutes vos<br/>demandes facilement</h1>
            <p>Saisissez, soumettez et suivez vos demandes en quelques clics.</p>
        </div>

        <div class="left-foot">
            © 2026 eNDa tamweel Tous droits réservés.
        </div>

    </div>

    <div class="right-panel">

        <div class="form-head">
            <div class="form-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="#de0065" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>
            <h2>Connexion</h2>
            <p>Accédez à votre espace</p>
        </div>

        <#if message?has_content>
            <div class="kc-alert kc-alert-${message.type}">
                ${kcSanitize(message.summary)?no_esc}
            </div>
        </#if>

        <form id="kc-form-login"
              action="${url.loginAction}"
              method="post"
              onsubmit="document.getElementById('kc-login').disabled=true;">

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
                    value="${(login.username!'')}"
                />
            </div>

            <div class="field-group">
                <label for="password">MOT DE PASSE</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    tabindex="2"
                    autocomplete="off"
                    placeholder="••••••••"
                />
            </div>

            <div class="options-row">
                <#if realm.rememberMe>
                    <label class="check-label">
                        <input type="checkbox" name="rememberMe" tabindex="3"
                               <#if login.rememberMe??>checked</#if>/>
                        Se souvenir de moi
                    </label>
                <#else>
                    <span></span>
                </#if>

                <#if realm.resetPasswordAllowed>
                    <a href="${url.loginResetCredentialsUrl}" tabindex="5" class="forgot-link">
                        Mot de passe oublié ?
                    </a>
                </#if>
            </div>

            <button id="kc-login" type="submit" tabindex="4" class="submit-btn">
                SE CONNECTER
            </button>

        </form>

        <div class="right-foot">
            © 2026 eNDa tamweel Tous droits réservés.
        </div>

    </div>

</div>

</body>
</html>