<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}"<#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<header class="header">
    <a href="/" class="home">
        <img src="data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%201698%20629%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20xml%3Aspace%3D%22preserve%22%20style%3D%22fill-rule%3Aevenodd%3Bclip-rule%3Aevenodd%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A2%3B%22%3E%3Cg%3E%3Cpath%20d%3D%22M780.974%2C425.653l35.827%2C0l0%2C-247.753l-35.827%2C-20.743l0%2C268.496Zm818.449%2C-140.761l0%2C-14.33l-35.986%2C0l0%2C155.091l35.986%2C0l0%2C-74.839c0%2C-19.319%202.441%2C-32.854%207.325%2C-40.603c4.988%2C-7.856%2013.429%2C-11.784%2025.317%2C-11.784c10.933%2C0%2018.471%2C2.973%2022.611%2C8.917c4.245%2C5.838%206.37%2C16.401%206.37%2C31.687l0%2C86.622l35.986%2C0l0%2C-95.061c0%2C-21.868%20-4.355%2C-37.631%20-13.057%2C-47.292c-10.087%2C-11.358%20-24.151%2C-17.038%20-42.197%2C-17.038c-15.71%2C0%20-29.831%2C6.21%20-42.355%2C18.63Zm-198.975%2C4.937c-16.03%2C15.711%20-24.045%2C34.767%20-24.045%2C57.164c0%2C23.78%207.857%2C43.525%2023.567%2C59.234c15.708%2C15.923%2035.19%2C23.885%2058.438%2C23.885c23.459%2C0%2043.256%2C-7.802%2059.394%2C-23.408c16.027%2C-15.708%2024.043%2C-35.19%2024.043%2C-58.437c0%2C-23.034%20-7.962%2C-42.46%20-23.885%2C-58.279c-16.137%2C-15.818%20-35.774%2C-23.726%20-58.916%2C-23.726c-23.034%2C0%20-42.569%2C7.858%20-58.596%2C23.567Zm24.998%2C94.582c-8.28%2C-9.019%20-12.419%2C-21.28%20-12.419%2C-36.782c0%2C-14.434%204.244%2C-26.218%2012.738%2C-35.349c8.492%2C-9.129%2019.586%2C-13.693%2033.279%2C-13.693c13.907%2C0%2025.104%2C4.564%2033.599%2C13.693c8.383%2C9.023%2012.579%2C21.074%2012.579%2C36.146c0%2C15.074%20-4.196%2C27.124%20-12.579%2C36.145c-8.387%2C9.023%20-19.586%2C13.535%20-33.599%2C13.535c-13.908%2C0%20-25.105%2C-4.562%20-33.598%2C-13.695Zm-204.708%2C-94.582c-16.029%2C15.711%20-24.043%2C34.767%20-24.043%2C57.164c0%2C23.78%207.855%2C43.525%2023.566%2C59.234c15.709%2C15.923%2035.19%2C23.885%2058.438%2C23.885c23.461%2C0%2043.256%2C-7.802%2059.393%2C-23.408c16.027%2C-15.708%2024.044%2C-35.19%2024.044%2C-58.437c0%2C-23.034%20-7.961%2C-42.46%20-23.885%2C-58.279c-16.136%2C-15.818%20-35.773%2C-23.726%20-58.914%2C-23.726c-23.036%2C0%20-42.571%2C7.858%20-58.599%2C23.567Zm25.001%2C94.582c-8.28%2C-9.019%20-12.42%2C-21.28%20-12.42%2C-36.782c0%2C-14.434%204.243%2C-26.218%2012.738%2C-35.349c8.492%2C-9.129%2019.585%2C-13.693%2033.28%2C-13.693c13.905%2C0%2025.102%2C4.564%2033.597%2C13.693c8.384%2C9.023%2012.579%2C21.074%2012.579%2C36.146c0%2C15.074%20-4.195%2C27.124%20-12.579%2C36.145c-8.386%2C9.023%20-19.585%2C13.535%20-33.597%2C13.535c-13.909%2C0%20-25.106%2C-4.562%20-33.598%2C-13.695Zm-209.008%2C-92.989c-12.634%2C15.818%20-18.949%2C35.029%20-18.949%2C57.641c0%2C23.247%206.792%2C42.62%2020.382%2C58.119c13.48%2C15.287%2030.786%2C22.93%2051.91%2C22.93c18.575%2C0%2034.976%2C-7.27%2049.203%2C-21.815l0%2C21.655c0%2C32.164%20-13.112%2C48.248%20-39.33%2C48.248c-14.228%2C0%20-25.055%2C-4.834%20-32.484%2C-14.49c-3.184%2C-4.141%20-5.469%2C-10.033%20-6.847%2C-17.676l-35.986%2C0c2.123%2C20.276%2010.084%2C36.146%2023.884%2C47.611c13.376%2C11.146%2030.414%2C16.719%2051.113%2C16.719c24.523%2C0%2043.79%2C-8.068%2057.802%2C-24.203c7.428%2C-8.386%2012.42%2C-18.419%2014.968%2C-30.095c0.848%2C-4.246%201.514%2C-9.156%201.989%2C-14.728c0.479%2C-5.574%200.717%2C-12.023%200.717%2C-19.347l0%2C-151.429l-35.826%2C0l0%2C17.515c-12.953%2C-14.543%20-29.195%2C-21.815%20-48.726%2C-21.815c-22.292%2C0%20-40.232%2C8.387%20-53.82%2C25.16Zm28.343%2C91.875c-7.111%2C-9.02%20-10.668%2C-20.594%20-10.668%2C-34.712c0%2C-14.331%203.557%2C-26.007%2010.668%2C-35.031c7.856%2C-10.085%2018.576%2C-15.127%2032.166%2C-15.127c12.738%2C0%2023.192%2C4.617%2031.368%2C13.853c8.065%2C9.023%2012.102%2C21.074%2012.102%2C36.146c0%2C14.118%20-3.663%2C25.691%20-10.988%2C34.712c-7.961%2C9.979%20-18.789%2C14.968%20-32.482%2C14.968c-13.695%2C0%20-24.418%2C-4.937%20-32.166%2C-14.809Zm-205.662%2C-93.787c-13.909%2C15.502%20-20.86%2C34.871%20-20.86%2C58.119c0%2C23.673%206.951%2C43.417%2020.86%2C59.235c14.012%2C15.499%2031.739%2C23.248%2053.183%2C23.248c16.983%2C0%2032.854%2C-6.901%2047.61%2C-20.7l0%2C16.241l35.986%2C0l0%2C-155.091l-35.986%2C0l0%2C17.993c-14.331%2C-14.862%20-30.52%2C-22.293%20-48.566%2C-22.293c-20.914%2C0%20-38.321%2C7.749%20-52.227%2C23.248Zm27.706%2C94.424c-7.963%2C-9.339%20-11.943%2C-21.44%20-11.943%2C-36.305c0%2C-13.906%204.086%2C-25.58%2012.261%2C-35.029c8.28%2C-9.341%2018.575%2C-14.013%2030.891%2C-14.013c13.057%2C0%2023.671%2C4.617%2031.846%2C13.852c8.174%2C9.45%2012.261%2C21.444%2012.261%2C35.987c0%2C14.546%20-4.087%2C26.538%20-12.261%2C35.985c-8.175%2C9.133%20-18.895%2C13.695%20-32.165%2C13.695c-12.42%2C0%20-22.717%2C-4.722%20-30.89%2C-14.172Z%22%20style%3D%22fill%3A%23fff%3Bfill-rule%3Anonzero%3B%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M433.076%2C218.112l-119.643%2C72.573l231.191%2C134.834l0%2C-268.4l-111.548%2C60.993Z%22%20style%3D%22fill%3A%23fff%3Bfill-rule%3Anonzero%3B%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M182.089%2C358.324l-182.004%2C113.234l272.405%2C157.158l272.055%2C-157.13l-272.233%2C-157.271l-90.223%2C44.009Z%22%20style%3D%22fill%3A%23fff%3Bfill-rule%3Anonzero%3B%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M0%2C157.023l0.085%2C314.535l272.227%2C-157.243l0%2C-314.315l-272.312%2C157.023Z%22%20style%3D%22fill%3A%23fff%3Bfill-rule%3Anonzero%3B%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M313.433%2C290.685l231.191%2C-133.566l-231.192%2C-133.42l0.001%2C266.986Z%22%20style%3D%22fill%3A%23fff%3Bfill-rule%3Anonzero%3B%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E" alt="Home logo">
    </a>
</header>

<body class="${properties.kcBodyClass!}">
<#--  <div class="${properties.kcLoginClass!}">  -->
    <#--  <div id="kc-header" class="${properties.kcHeaderClass!}">
        <div id="kc-header-wrapper"
             class="${properties.kcHeaderWrapperClass!}">${kcSanitize(msg("loginTitleHtml",(realm.displayNameHtml!'')))?no_esc}</div>
    </div>  -->
    <#--  <div class="${properties.kcFormCardClass!}">  -->
        <#--  <header class="${properties.kcFormHeaderClass!}">
            <#if realm.internationalizationEnabled  && locale.supported?size gt 1>
                <div class="${properties.kcLocaleMainClass!}" id="kc-locale">
                    <div id="kc-locale-wrapper" class="${properties.kcLocaleWrapperClass!}">
                        <div id="kc-locale-dropdown" class="${properties.kcLocaleDropDownClass!}">
                            <a href="#" id="kc-current-locale-link">${locale.current}</a>
                            <ul class="${properties.kcLocaleListClass!}">
                                <#list locale.supported as l>
                                    <li class="${properties.kcLocaleListItemClass!}">
                                        <a class="${properties.kcLocaleItemClass!}" href="${l.url}">${l.label}</a>
                                    </li>
                                </#list>
                            </ul>
                        </div>
                    </div>
                </div>
            </#if>
        <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                    </div>
                    <div class="col-md-10">
                        <h1 id="kc-page-title"><#nested "header"></h1>
                    </div>
                </div>
            <#else>
                <h1 id="kc-page-title"><#nested "header"></h1>
            </#if>
        <#else>
            <#if displayRequiredFields>
                <div class="${properties.kcContentWrapperClass!}">
                    <div class="${properties.kcLabelWrapperClass!} subtitle">
                        <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
                    </div>
                    <div class="col-md-10">
                        <#nested "show-username">
                        <div id="kc-username" class="${properties.kcFormGroupClass!}">
                            <label id="kc-attempted-username">${auth.attemptedUsername}</label>
                            <a id="reset-login" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
                                <div class="kc-login-tooltip">
                                    <i class="${properties.kcResetFlowIcon!}"></i>
                                    <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            <#else>
                <#nested "show-username">
                <div id="kc-username" class="${properties.kcFormGroupClass!}">
                    <label id="kc-attempted-username">${auth.attemptedUsername}</label>
                    <a id="reset-login" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
                        <div class="kc-login-tooltip">
                            <i class="${properties.kcResetFlowIcon!}"></i>
                            <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
                        </div>
                    </a>
                </div>
            </#if>
        </#if>
      </header>  -->

      <div id="kc-content" class="kc-content">
        <div id="kc-content-wrapper" class="kc-content-wrapper">

          <#-- App-initiated actions should not see warning messages about the need to complete the action -->
          <#-- during login.                                                                               -->
          <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="alert-${message.type} ${properties.kcAlertClass!} pf-m-<#if message.type = 'error'>danger<#else>${message.type}</#if>">
                  <div class="pf-c-alert__icon">
                      <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                      <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                      <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                      <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                  </div>
                      <span class="${properties.kcAlertTitleClass!} h2">${kcSanitize(message.summary)?no_esc}</span>
              </div>
          </#if>

          <#nested "form">

          <#if auth?has_content && auth.showTryAnotherWayLink()>
              <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                  <div class="${properties.kcFormGroupClass!}">
                      <input type="hidden" name="tryAnotherWay" value="on"/>
                      <a href="#" id="try-another-way"
                         onclick="document.forms['kc-select-try-another-way-form'].submit();return false;">${msg("doTryAnotherWay")}</a>
                  </div>
              </form>
          </#if>

          <#nested "socialProviders">

          <#if displayInfo>
              <div id="kc-info" class="${properties.kcSignUpClass!}">
                  <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                      <#nested "info">
                  </div>
              </div>
          </#if>
        </div>
      </div>
    <#--  </div>  -->
  <#--  </div>  -->
  <div class="background"></div>
</body>
</html>
</#macro>
