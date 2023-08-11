<#import "template.ftl" as layout>
<#import "password-commons.ftl" as passwordCommons>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>

    <div id="kc-form" class="kc-form">
        <div id="kc-form-wrapper">
            <#if section = "form">
                <h1>${msg("updatePasswordTitle")}</h1>
                <form id="kc-passwd-update-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                    <input type="text" id="username" name="username" value="${username}" autocomplete="username"
                        readonly="readonly" style="display:none;"/>
                    <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="password-new" class="${properties.kcLabelClass!}">${msg("passwordNew")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="password" id="password-new" name="password-new" class="${properties.kcInputClass!}"
                                autofocus autocomplete="new-password"
                                aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                            />

                            <#if messagesPerField.existsError('password')>
                                <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
                            <input type="password" id="password-confirm" name="password-confirm"
                                class="${properties.kcInputClass!}"
                                autocomplete="new-password"
                                aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                            />

                            <#if messagesPerField.existsError('password-confirm')>
                                <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                                </span>
                            </#if>

                        </div>
                    </div>

                    <div class="${properties.kcFormGroupClass!}">
                        <@passwordCommons.logoutOtherSessions/>

                        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                            <#if isAppInitiatedAction??>
                                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doSubmit")}" />
                                <button class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}" type="submit" name="cancel-aia" value="true" />${msg("doCancel")}</button>
                            <#else>
                                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doSubmit")}" />
                            </#if>
                        </div>
                    </div>
                </form>
            </#if>
        </div>
    </div>
</@layout.registrationLayout>
