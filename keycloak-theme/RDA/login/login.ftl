<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

<#if section = "header">
    ${msg("loginAccountTitle")}

<#elseif section = "form">
<div id="kc-form">
  <div id="kc-form-wrapper">

    <#if realm.password>
    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

      <#if !usernameHidden??>
      <div class="form-group">
        <label for="username">
          <#if !realm.loginWithEmailAllowed>
            ${msg("username")}
          <#elseif !realm.registrationEmailAsUsername>
            ${msg("usernameOrEmail")}
          <#else>
            ${msg("email")}
          </#if>
        </label>
        <input
          tabindex="1"
          id="username"
          class="form-control"
          name="username"
          value="${(login.username!'')}"
          type="text"
          autofocus
          autocomplete="off"
          aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
        />
        <#if messagesPerField.existsError('username','password')>
          <span class="field-error">${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
        </#if>
      </div>
      </#if>

      <div class="form-group">
        <label for="password">${msg("password")}</label>
        <div class="password-wrapper">
          <input
            tabindex="2"
            id="password"
            class="form-control"
            name="password"
            type="password"
            autocomplete="current-password"
            aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
          />
          <button type="button" class="toggle-password" onclick="togglePassword()" aria-label="Show password">
            <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>

      <div class="form-options">
        <#if realm.rememberMe && !usernameHidden??>
        <div class="checkbox">
          <label>
            <#if login.rememberMe??>
              <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
            <#else>
              <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
            </#if>
          </label>
        </div>
        </#if>

        <#if realm.resetPasswordAllowed>
        <a tabindex="5" href="${url.loginResetCredentialsUrl}" class="forgot-link">${msg("doForgotPassword")}</a>
        </#if>
      </div>

      <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

      <button tabindex="4" class="btn-submit" name="login" id="kc-login" type="submit">
        ${msg("doLogIn")}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>

    </form>
    </#if>

    <#-- Social login providers (GitHub etc.) -->
    <#if social.providers??>
    <div class="social-divider">
      <span>or continue with</span>
    </div>
    <div class="social-providers">
      <#list social.providers as p>
      <a href="${p.loginUrl}" class="social-btn">
        <#if p.alias == "github">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </#if>
        ${p.displayName}
      </a>
      </#list>
    </div>
    </#if>

    <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
    <div class="register-link">
      <span>${msg("noAccount")}</span>
      <a tabindex="6" href="${url.registrationUrl}">${msg("doRegister")}</a>
    </div>
    </#if>

  </div>
</div>

<script>
function togglePassword() {
  var input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}
</script>

</#if>
</@layout.registrationLayout>
