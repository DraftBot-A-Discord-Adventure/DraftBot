<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
            ${message.summary}
        </#if>
    <#elseif section = "form">
    <div id="kc-info-message">
        <p class="instruction">${message.summary}<#if requiredActions??><#list requiredActions>: <b><#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></b></#list><#else></#if></p>
        <#-- Keycloak refuses a custom scheme as base URL: the game's own address is kept in a client attribute. -->
        <#assign gameUri = (client.attributes["crownicles.returnUri"])!"">
        <#if skipLink??>
        <#elseif pageRedirectUri?has_content>
            <p><a href="${pageRedirectUri}">${msg("backToApplication")}</a></p>
        <#elseif actionUri?has_content>
            <p><a href="${actionUri}">${msg("proceedWithAction")}</a></p>
        <#elseif gameUri?has_content>
            <#-- In the game's sheet, this ends the browser session; in the phone's browser, it opens the game. -->
            <div id="kc-form-buttons">
                <a id="crownicles-back-to-game" href="${gameUri}" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}">${msg("crowniclesBackToGame")}</a>
            </div>
        <#elseif (client.baseUrl)?has_content>
            <p><a href="${client.baseUrl}">${msg("backToApplication")}</a></p>
        <#else>
            <p class="instruction">${msg("crowniclesReturnToGame")}</p>
        </#if>
    </div>
    </#if>
</@layout.registrationLayout>
