'use strict';
window.WaraqaAuthGate = true;
window.WaraqaAuthorized = false;

(async () => {
  const ADMIN_EMAIL = "aaddaa5400@gmail.com";
  const OWNER_NOTIFICATION_EMAIL = "alatwi3@me.com";
  // Public browser identifiers only. The iCloud app password stays in EmailJS.
  const EMAILJS_SERVICE_ID = "service_jgov56c";
  const EMAILJS_TEMPLATE_ID = "template_aa6c4f2";
  const EMAILJS_PUBLIC_KEY = "TCwGKubjHn_gei9eS";
  const SUBSCRIPTION_PENDING_MESSAGE = "الطلب تحت الإجراء. سيتم التفعيل مباشرة بعد التحقق من وصول الحوالة.";
  const isAdminAccount = (user) => String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;
  const firebaseConfig = {
    apiKey: "AIzaSyCosJv8S0atz72MlwRv8K0kdE1wyxEy6Nc",
    authDomain: "waraqa-9b563.firebaseapp.com",
    projectId: "waraqa-9b563",
    storageBucket: "waraqa-9b563.firebasestorage.app",
    messagingSenderId: "329645999624",
    appId: "1:329645999624:web:aa36f2746329a4a56173bd"
  };
  const gate = document.createElement("section");
  gate.id = "waraqa-auth-gate";
  gate.setAttribute("aria-live", "polite");
  gate.innerHTML = `
    <style>
      #waraqa-auth-gate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:#e9f0ec;direction:rtl;font-family:inherit;color:#163b32}
      #waraqa-auth-gate[hidden],#waraqa-auth-gate .wa-card[hidden],#wa-mail-retry[hidden]{display:none!important}
      #waraqa-auth-gate *{box-sizing:border-box}
      .wa-receipt-button{padding:8px 12px;margin:3px;border:0;border-radius:9px;background:#0a7058;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer}
      .wa-card{width:min(1080px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:32px;background:#fff;border:1px solid #dce8df;border-radius:28px;box-shadow:0 28px 90px #0004}.wa-page-heading{text-align:center;margin:0 auto 24px;max-width:720px}.wa-page-heading h1{margin:0 0 8px;font-size:clamp(26px,3vw,36px);color:#153e32}.wa-page-heading p{margin:0;color:#718179;line-height:1.8}.wa-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}.wa-section{padding:24px;border:1px solid #e0eae4;border-radius:22px;background:#fff;box-shadow:0 12px 32px #173b2d0a}.wa-section h2{margin:0 0 6px;font-size:22px;color:#173d32}.wa-section-intro{margin:0 0 16px;color:#718179;line-height:1.7;font-size:14px}.wa-brand{margin-bottom:12px}.wa-section .wa-brand{margin-bottom:16px}.wa-price-card{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f5efe1,#fff9ec);border:1px solid #ead9b5}.wa-price-card small{display:block;color:#697a71}.wa-price-value{font-size:28px;font-weight:900;color:#a36a16;white-space:nowrap}.wa-price-value small{display:inline;color:#8a6b39;font-size:13px;font-weight:700}.wa-transfer{margin-top:16px;padding:16px;border:1px dashed #b6c8bd;border-radius:16px;background:#f7faf8}.wa-transfer-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-weight:900;color:#244b3e}.wa-setup-badge{padding:4px 9px;border-radius:999px;background:#fff0ce;color:#835b13;font-size:11px;white-space:nowrap}.wa-transfer p{margin:7px 0;color:#687b72;font-size:13px;line-height:1.8}.wa-plan-submit{width:100%;margin-top:15px;padding:13px 16px;border:0;border-radius:12px;background:linear-gradient(135deg,#0a7058,#14866b);color:#fff;font:800 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 18px #0a70582b}.wa-plan-submit:hover{filter:brightness(1.05);transform:translateY(-1px)}.wa-plan-note{margin:10px 0 0;color:#718179;font-size:12px;text-align:center;line-height:1.7}.wa-plan-select{display:block;width:100%;margin-top:6px;padding:12px;border:1px solid #cbd9d1;border-radius:11px;background:#fbfdfc;color:#182f28;font:inherit}.wa-transfer .wa-field{margin-bottom:0}.wa-login-section{background:linear-gradient(150deg,#fff,#f8fbf9)}.wa-login-section .wa-brand{margin-bottom:14px}.wa-login-section .wa-field{margin:14px 0}.wa-login-section .wa-actions .wa-button{flex:1}.wa-section .wa-message{min-height:26px}@media(max-width:760px){#waraqa-auth-gate{padding:12px}.wa-card{padding:22px 18px;max-height:calc(100vh - 24px);border-radius:22px}.wa-columns{grid-template-columns:1fr;gap:12px}.wa-section{padding:19px}.wa-page-heading{margin-bottom:18px}.wa-section h2{font-size:20px}}
      .wa-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.wa-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#0a7058;color:#fff;font-size:24px}.wa-brand b{font-size:23px}.wa-brand small{display:block;color:#74847d;font-size:13px}
      .wa-card h1{margin:0 0 8px;font-size:22px}.wa-intro{margin:0 0 20px;color:#687a72;line-height:1.8}
      .wa-field{display:block;margin:13px 0;color:#304b42;font-weight:700;font-size:14px}.wa-field input{display:block;width:100%;margin-top:6px;padding:12px 13px;border:1px solid #cbd9d1;border-radius:11px;background:#fbfdfc;color:#182f28;font:inherit;direction:ltr;text-align:left}.wa-password-wrap{position:relative;margin-top:6px}.wa-password-wrap input{margin-top:0;padding-right:82px}.wa-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;border-radius:7px;padding:7px 9px;background:transparent;color:#116a55;font:700 13px system-ui,sans-serif;cursor:pointer}
      .wa-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.wa-button{border:0;border-radius:11px;padding:12px 16px;background:#0a7058;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}.wa-button.alt{border:1px solid #d0ded6;background:#fff;color:#245548}.wa-button:disabled{opacity:.6;cursor:wait}
      .wa-message{min-height:26px;margin:14px 0 0;color:#526a60;line-height:1.7}.wa-message.error{color:#a42e2e}.wa-message.ok{color:#08734d}
      .wa-switch{border:0;background:none;color:#116a55;text-decoration:underline;cursor:pointer;font:inherit;padding:0}.wa-small{margin-top:12px;font-size:13px;color:#6c7d75}.wa-local{margin-top:18px;padding:12px 14px;border-radius:12px;background:#f2f6f3;color:#53665c;font-size:13px;line-height:1.8}
      .waraqa-account-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d7e3dc;border-radius:999px;background:#f8fbf9;color:#174b3e;font-size:12px;max-width:none;white-space:nowrap;flex-shrink:0}.waraqa-account-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}.waraqa-account-chip button{border:0;background:none;color:#9a3b32;font:inherit;cursor:pointer}.waraqa-account-chip button{border:0;background:none;color:#9a3b32;font:inherit;cursor:pointer;padding:4px 6px}.waraqa-account-chip .wa-admin-open{padding:7px 10px;border-radius:9px;background:#0a7058;color:#fff;font-weight:800}.wa-admin-overlay{position:fixed;inset:0;z-index:2147483001;display:none;place-items:center;padding:18px;background:#10211dcc;direction:rtl;color:#17372d}.wa-admin-overlay.open{display:grid}.wa-admin-panel{width:min(1000px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:22px;background:#f8fbf9;box-shadow:0 24px 80px #0006}.wa-admin-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.wa-admin-head h2{margin:0;font-size:23px}.wa-admin-head p{margin:5px 0 0;color:#60756b}.wa-admin-close{border:0;border-radius:50%;width:38px;height:38px;background:#e5ece8;color:#24473b;font-size:22px;cursor:pointer}.wa-admin-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}.wa-admin-stat{padding:14px;border-radius:14px;background:#e8f3ee}.wa-admin-stat b{display:block;color:#0a7058;font-size:25px}.wa-admin-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end;padding:15px;border:1px solid #dbe8e0;border-radius:16px;background:white}.wa-admin-form label{display:block;font-size:13px;font-weight:800;color:#40594e}.wa-admin-form input{display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #cbd9d1;border-radius:9px;font:inherit}.wa-admin-form button{padding:11px 15px;border:0;border-radius:10px;background:#0a7058;color:white;font-weight:800;cursor:pointer}.wa-admin-message{min-height:26px;margin:10px 2px;color:#08734d}.wa-admin-message.error{color:#a42e2e}.wa-admin-table-wrap{overflow:auto;border:1px solid #dbe8e0;border-radius:14px;background:white}.wa-admin-table{width:100%;border-collapse:collapse;min-width:650px}.wa-admin-table th,.wa-admin-table td{padding:11px;text-align:right;border-bottom:1px solid #e4ece7}.wa-admin-table th{background:#edf4f0;color:#345448}.wa-admin-action{border:0;border-radius:8px;padding:7px 10px;background:#b33b36;color:#fff;font-weight:700;cursor:pointer}.wa-admin-action:disabled,.wa-admin-form button:disabled{opacity:.6;cursor:wait}@media(max-width:640px){.wa-admin-panel{padding:16px}.wa-admin-stats{grid-template-columns:1fr}.wa-admin-form{grid-template-columns:1fr}.wa-admin-head h2{font-size:19px}}
      @media(max-width:540px){.wa-card{padding:23px 20px}.waraqa-account-chip{gap:5px;padding:6px}.waraqa-account-chip span{max-width:90px}.waraqa-account-chip button{font-size:11px;padding:5px}}
    .wa-page-heading{color:#321050}.wa-page-heading h1{color:#351253}.wa-section{border-color:#e6d8f0}.wa-section h2{color:#3b155e}.wa-login-section{background:linear-gradient(145deg,#fffdf8,#f4eaff);border-color:#dcc7ec}.wa-subscribe-section{background:linear-gradient(145deg,#f4eaff,#fffaf0);border-color:#cfb2e3}.wa-field{color:#45205e}.wa-field input,.wa-plan-select{border-color:#d9c3e8;background:#fffdf9;color:#321050}.wa-button,.wa-plan-submit,.wa-admin-form button{background:linear-gradient(135deg,#552080,#7a42a5)}.wa-button.alt{border-color:#cdb1e0;background:#fffaf0;color:#512077}.wa-price-card{background:linear-gradient(135deg,#f5eaff,#fff7e3);border-color:#d4b55a}.wa-price-value{color:#895e00}.wa-transfer{background:#fffaf0;border-color:#d7c28b}.wa-setup-badge{background:#efe2ff;color:#552080}.wa-brand-centered{margin:0 auto 16px}.wa-brand-logo{display:block;width:176px;max-width:55vw;height:auto;max-height:108px;object-fit:contain;border-radius:12px}@media(max-width:760px){.wa-brand-logo{width:148px;max-height:90px}}\n    
      /* Waraqa black, gold, and orange brand palette */
      .wa-brand-logo{display:block;width:108px;height:88px;object-fit:contain;background:#000;border:1px solid #d4af37;border-radius:14px;padding:5px}
      .wa-login-section,.wa-subscribe-section{background:#101010!important;border:1px solid #d4af37!important;color:#f4ead0!important}
      .wa-section h2{color:#e7c76a!important}
      .wa-section-intro,.wa-plan-note,.wa-field,.wa-transfer p{color:#e7dfc8!important}
      .wa-price-card,.wa-transfer{background:#191919!important;border-color:#a8832f!important}
      .wa-price-card small,.wa-transfer-title{color:#f4ead0!important}
      .wa-price-value{color:#f2cf63!important}
      .wa-setup-badge{background:#ff7900!important;color:#17110a!important}
      .wa-field input,.wa-plan-select{background:#fffdf6!important;color:#191919!important;border-color:#d4af37!important}
      .wa-password-toggle{color:#8a5b00!important}
      .wa-plan-submit{background:#d4af37!important;color:#111!important;box-shadow:0 8px 18px #d4af3733!important}
      .wa-button{background:#d4af37!important;color:#111!important}
      .wa-button.alt{background:#111!important;color:#f4ead0!important;border:1px solid #d4af37!important}
      .wa-section .wa-message{color:#f4ead0}

      /* Warm ivory page frame to balance the black and gold form panels */
      #waraqa-auth-gate{background:linear-gradient(135deg,#f6f0e2 0%,#eee3ca 50%,#f8f3e8 100%)!important;color:#3c321f}
      .wa-card{background:#fffaf0!important;border:1px solid #d8c48e!important;box-shadow:0 28px 90px #4c391a26!important}
      .wa-page-heading h1{color:#493618!important}
      .wa-page-heading p,.wa-intro{color:#75694f!important}

      .wa-card{background:#fffaf0!important;border:2px solid #ef7b22!important;box-shadow:0 10px 0 #c95112,0 24px 54px #71310e45,inset 0 1px 0 #fff!important}
.wa-plan-note.wa-plan-message-visible{padding:12px;border:1px solid #ef7b22;border-radius:12px;background:#21170d;color:#ffcf62!important;font-weight:900;box-shadow:0 5px 0 #c95112}
/* Owner dashboard: midnight blue, warm orange, and clear status cards. */
.wa-admin-overlay{background:#07182bd1;backdrop-filter:blur(7px)}
.wa-admin-panel{width:min(1120px,100%);padding:24px;background:#f2f5fa;border:1px solid #dbe3ef;border-radius:26px;box-shadow:0 30px 110px #03132580;color:#172d48;font-family:inherit}
.wa-admin-head{padding:24px;margin:-24px -24px 22px;background:linear-gradient(120deg,#102541,#1a3c61);border-radius:25px 25px 0 0;position:relative;overflow:hidden;border-bottom:3px solid #f39745}
.wa-admin-head h2{color:#fff;font-size:25px;letter-spacing:-.4px}.wa-admin-head p{color:#c2d0df;line-height:1.8}
.wa-admin-close{background:#ffffff18;color:#ffb16b;border:1px solid #ffffff28;flex-shrink:0;width:40px;height:40px}
.wa-admin-head .wa-admin-form-button{background:#ff9e50!important;color:#142740!important;box-shadow:0 5px 14px #06172d40;border:0;font-weight:800}
.wa-admin-stats{gap:14px;margin-bottom:22px}.wa-admin-stat{background:#fff;border:1px solid #dce5ee;border-radius:17px;padding:18px 20px;box-shadow:0 6px 16px #1c355b08;color:#5c6e84;position:relative;overflow:hidden;font-weight:700}
.wa-admin-stat:before{content:"";position:absolute;right:0;top:17px;bottom:17px;width:4px;background:#f39745;border-radius:6px}.wa-admin-stat b{font-size:34px;margin-top:8px;color:#142d4a}
.wa-admin-stat:first-child:before{background:#17a182}.wa-admin-stat:first-child b{color:#10816b}.wa-admin-stat:nth-child(2):before{background:#d99841}
.wa-admin-panel .wa-admin-table-wrap{border:1px solid #d5dfeb;border-radius:15px;box-shadow:0 7px 20px #142a4707;margin-bottom:22px}
.wa-admin-panel .wa-admin-table th{background:#102640;color:#ffa65d;font-size:13px;font-weight:800;padding:15px 14px;border-bottom:0;white-space:nowrap}
.wa-admin-panel .wa-admin-table td{padding:14px;border-bottom:1px solid #e8edf4;color:#263c56;font-size:14px;line-height:1.7}.wa-admin-panel .wa-admin-table tbody tr:nth-child(even){background:#f7f9fc}.wa-admin-panel .wa-admin-table tbody tr:hover{background:#edf3fa}
.wa-admin-panel h3{font-size:19px;color:#142d4a;margin:22px 0 12px}.wa-admin-panel .wa-admin-form{border:1px solid #dbe3ee;box-shadow:0 5px 16px #142b4606;border-radius:17px;padding:18px;gap:12px}.wa-admin-form label{color:#496079}.wa-admin-form input{background:#fafbfd;color:#193452;border-color:#cfdbe8;padding:12px;box-sizing:border-box;min-width:0}
.wa-admin-panel .wa-admin-form button,.wa-admin-panel .wa-admin-form-button,.wa-admin-panel .wa-receipt-button{background:#173a5e;color:#fff;border:0;padding:11px 14px;border-radius:10px;font:700 13px system-ui,sans-serif;cursor:pointer}.wa-admin-panel button:hover{filter:brightness(1.08)}
.wa-admin-panel .wa-admin-action{background:#b83d45;border-radius:9px;padding:8px 14px;box-shadow:0 3px 7px #b83d4514}
.wa-admin-panel .wa-admin-message{font-size:13px;margin:16px 4px;color:#387260}.wa-admin-panel .wa-admin-message.error{color:#b23c43}.wa-admin-mail{border-color:#dae3ef!important;border-radius:17px!important;padding:18px!important;color:#3c526c}.wa-admin-mail strong{color:#173451}.wa-admin-mail p{line-height:1.8;font-size:13px}
.wa-email-quota{padding:22px;margin:0 0 20px;border-radius:20px;background:linear-gradient(120deg,#fff,#fff8ee);border:1px solid #ebd9c1;box-shadow:0 8px 24px #3d291108}
.wa-quota-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}.wa-admin-eyebrow{font-size:11px;color:#ab6c2d;font-weight:800;letter-spacing:.3px}.wa-admin-panel .wa-quota-heading h3{margin:5px 0;font-size:22px}.wa-quota-link{color:#173b60;text-decoration:none;font-weight:800;border:1px solid #d4dfeb;background:#fff;padding:10px 14px;border-radius:11px;font-size:13px}.wa-quota-link:hover{background:#edf3fa}
.wa-quota-description{font-size:13px;color:#687586;line-height:1.9;margin:12px 0 18px}.wa-quota-numbers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.wa-quota-numbers>div{padding:16px 18px;background:#fff;border:1px solid #e4e8ee;border-radius:14px}.wa-quota-numbers span{display:block;color:#62738a;font-size:12px;font-weight:700}.wa-quota-numbers strong{display:block;font-size:34px;line-height:1.5;color:#163452;font-variant-numeric:tabular-nums}.wa-quota-numbers>div:first-child{background:#fff0de;border-color:#f1d3ad}.wa-quota-numbers>div:first-child strong{color:#ad621d}
.wa-quota-progress{height:9px;background:#e6eaf0;border-radius:30px;overflow:hidden;margin-top:18px}.wa-quota-progress>div{height:100%;border-radius:30px;background:linear-gradient(90deg,#f4ad5a,#dd8432);transition:width .3s}
.wa-quota-alert{font-size:13px;line-height:1.9;color:#775a35;margin:12px 0 6px}.wa-email-quota[data-tone="danger"]{border-color:#e8b1af;background:#fff6f4}.wa-email-quota[data-tone="danger"] .wa-quota-alert{color:#a93439}.wa-email-quota[data-tone="danger"] .wa-quota-progress>div{background:#c64b4b}.wa-email-quota[data-tone="warning"] .wa-quota-alert{font-weight:800;color:#9c5c1c}
#wa-quota-updated{display:block;color:#7a8491;font-size:11px;line-height:1.8}.wa-quota-details{margin-top:18px;padding-top:14px;border-top:1px solid #e8e1d8}.wa-quota-details summary{cursor:pointer;font-weight:800;font-size:13px;color:#1c4267}.wa-quota-details form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:12px;align-items:end;margin-top:15px}.wa-quota-details label{display:block;font-size:12px;color:#5b6d82;font-weight:700}.wa-quota-details input{display:block;width:100%;box-sizing:border-box;min-width:0;border:1px solid #d0dce8;border-radius:9px;background:#fff;padding:11px;margin-top:7px;font:inherit;color:#193452}.wa-quota-details button{border:0;border-radius:9px;padding:12px 16px;background:#173a5e;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer}.wa-quota-details p{font-size:12px;color:#52705d}
@media(max-width:700px){.wa-admin-panel{padding:16px;border-radius:20px}.wa-admin-head{margin:-16px -16px 18px;padding:20px 16px;border-radius:19px 19px 0 0}.wa-admin-head h2{font-size:20px}.wa-admin-stats{grid-template-columns:1fr}.wa-email-quota{padding:16px}.wa-quota-numbers{gap:7px}.wa-quota-numbers>div{padding:12px 9px}.wa-quota-numbers span{font-size:11px}.wa-quota-numbers strong{font-size:27px}.wa-quota-details form{grid-template-columns:1fr}.wa-quota-link{font-size:12px}}

      </style>
    <div class="wa-card" role="dialog" aria-modal="true" aria-labelledby="wa-title">
      <div class="wa-page-heading">
        <div class="wa-brand wa-brand-centered" style="justify-content:center"><img class="wa-brand-logo" src="data:image/png;base64,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" alt="ورقة"></div>
        <h1 id="wa-title">ورقة تجعل تصحيح الاختبارات أسهل</h1>
        <p class="wa-intro">اشترك لتبدأ، أو سجّل دخولك إذا كان لديك حساب. تبقى بيانات الطلاب والاختبارات محفوظة على جهازك.</p>
      </div>
      <div class="wa-columns">
        <section class="wa-section wa-login-section" aria-labelledby="wa-login-title">
          <h2 id="wa-login-title">لديك حساب؟ سجّل الدخول</h2>
          <p class="wa-section-intro">أدخل بريدك ورمز الدخول للمتابعة إلى ورقة.</p>
          <form id="wa-form">
            <label class="wa-field">البريد الإلكتروني<input id="wa-email" type="email" autocomplete="email" required></label>
            <label class="wa-field">رمز الدخول<input id="wa-pin" type="password" autocomplete="current-password" required minlength="6" aria-describedby="wa-pin-help"></label>
            <small id="wa-pin-help">استخدم رمزك الحالي. يمكنك تغييره من زر «تغيير رمز الدخول» بعد الدخول.</small>
            <div class="wa-actions"><button class="wa-button" id="wa-submit" type="submit">دخول</button></div>
          </form>
          <p class="wa-message" id="wa-message" role="status"></p>
        </section>
        <section class="wa-section wa-subscribe-section" aria-labelledby="wa-subscribe-title">
          <h2 id="wa-subscribe-title">ابدأ اشتراكك في ورقة</h2>
          <p class="wa-section-intro">اكتب بياناتك وأرسل الطلب مباشرة. أنشئ حساب الدخول بعد تفعيل الاشتراك.</p>
          <label class="wa-field">الاسم<input id="wa-plan-name" type="text" autocomplete="name" maxlength="80" placeholder="الاسم الكامل" required></label>
          <label class="wa-field">البريد الإلكتروني<input id="wa-plan-email" type="email" autocomplete="email" maxlength="254" placeholder="name@example.com" required></label>
          <label class="wa-field">رقم الجوال<input id="wa-plan-phone" type="tel" autocomplete="tel" maxlength="24" placeholder="05xxxxxxxx" required></label>
          <label class="wa-field">مدة الاشتراك<select id="wa-plan-months" class="wa-plan-select"><option value="1">شهر واحد · 29 ريالًا</option></select></label>
          <div class="wa-price-card"><div><strong>اشتراك ورقة</strong><small id="wa-plan-summary">شهر واحد · 29 ريالًا</small></div><div class="wa-price-value"><span id="wa-plan-total">29</span> <small>ريال</small></div></div>
          <div class="wa-transfer">
            <div class="wa-transfer-title"><span>بيانات الدفع والتحويل</span><span class="wa-setup-badge">تُستكمل لاحقًا</span></div>
            <p>سيُضاف هنا اسم البنك واسم صاحب الحساب والآيبان بعد تجهيز بياناتك البنكية.</p>
            <p>أرسل طلبك الآن؛ وبعد التحقق من التحويل يُفعّل الاشتراك من لوحة المالك.</p>
            <label class="wa-field">رقم مرجع التحويل (اختياري)<input id="wa-plan-reference" type="text" maxlength="80" placeholder="يُضاف بعد التحويل"></label>
          </div>
          <button class="wa-plan-submit" id="wa-subscribe-button" type="button">إرسال طلب الاشتراك</button>
          <p class="wa-plan-note" id="wa-plan-message" role="status">الاشتراك 29 ريالًا للشهر. لا تحتاج إلى إنشاء حساب قبل إرسال الطلب؛ أنشئه بعد التفعيل.</p>
          <button id="wa-mail-retry" class="wa-button alt" type="button" hidden>إعادة محاولة تنبيه المالك</button>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(gate);
  const $ = (selector) => gate.querySelector(selector);
  const message = $("#wa-message");
  const planMonths = $("#wa-plan-months");
    const planTotal = $("#wa-plan-total");
    const planSummary = $("#wa-plan-summary");
    function updatePlanPrice() {
      const months = Number(planMonths.value) || 1;
      planTotal.textContent = String(months * 29);
      planSummary.textContent = (months === 1 ? "شهر واحد" : months + " أشهر") + " · 29 ريالًا للشهر";
    }
    planMonths.addEventListener("change", updatePlanPrice);
    $("#wa-subscribe-button").addEventListener("click", async (event) => {
      const note = $("#wa-plan-message");
      const button = event.currentTarget;
      const showFeedback = (text, color = "#08734d") => {
        note.textContent = text;
        note.style.color = color;
        note.classList.add("wa-plan-message-visible");
        note.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      const name = $("#wa-plan-name").value.trim();
      const email = $("#wa-plan-email").value.trim().toLowerCase();
      const phone = $("#wa-plan-phone").value.trim();
      const months = Number(planMonths.value);
      const reference = $("#wa-plan-reference").value.trim();
      if (!name || !email || !phone || !$("#wa-plan-email").checkValidity() || name.length > 80 || phone.length > 24) {
        showFeedback("أكمل الاسم والبريد ورقم الجوال بصيغة صحيحة.", "#a42e2e");
        return;
      }
      button.disabled = true;
      $("#wa-mail-retry").hidden = true;
      try {
        let requestUser = auth?.currentUser;
        if (!requestUser) {
          showFeedback("جارٍ تجهيز طلبك…");
          requestUser = (await authSdk.signInAnonymously(auth)).user;
        }
        if (!requestUser.isAnonymous &&
            String(requestUser.email || "").trim().toLowerCase() !== email) {
          showFeedback("استخدم البريد نفسه المسجّل في الحساب، أو سجّل الخروج لإرسال طلب جديد.", "#a42e2e");
          return;
        }
        showFeedback("جارٍ إرسال طلب الاشتراك…");
        const ref = firebase.doc(db, "subscriptionRequests", requestUser.uid);
        const existing = await firebase.getDoc(ref);
        if (existing.exists() && existing.data().status === "pending") {
          saveBillingProfile(email, { name, phone });
          showFeedback(SUBSCRIPTION_PENDING_MESSAGE);
          await showSavedRequestNotice(requestUser.uid, false, showFeedback);
          return;
        }
        await firebase.setDoc(ref, {
          uid: requestUser.uid,
          name,
          email,
          phone,
          months,
          amount: months * 29,
          reference,
          status: "pending",
          createdAt: firebase.serverTimestamp()
        });
        saveBillingProfile(email, { name, phone });
        showFeedback(SUBSCRIPTION_PENDING_MESSAGE);
        await showSavedRequestNotice(requestUser.uid, true, showFeedback);
      } catch (error) {
        const code = error?.code || "";
        const message = code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation"
          ? "فعّل تسجيل الدخول المجهول من Firebase Authentication ثم أعد إرسال الطلب."
          : code === "permission-denied"
            ? "تعذر حفظ الطلب. انشر قواعد Firestore المحدّثة من firebase/firestore.rules ثم أعد المحاولة."
            : "تعذر إرسال الطلب" + (code ? " (رمز Firebase: " + code + ")" : error?.message ? ": " + String(error.message).replace(/\\s+/g, " ").slice(0, 180) : " (تحقق من الاتصال).");
        showFeedback(message, "#a42e2e");
      } finally {
        button.disabled = false;
      }
    });
    updatePlanPrice();
  let auth, db, firebase, authSdk;
  let adminRequestsUnsubscribe = null;
  let adminProvisionBusy = false;
  let provisioningSequence = 0;


  function subscriptionNoticeKey(uid) {
    return "waraqa-subscription-notice:emailjs-v2:" + new URL(".", location.href).pathname + ":" + uid;
  }
  function noticeState(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  }
  function saveNoticeState(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function ownerNoticePayload(test = false, request = {}) {
    const clean = (value, limit) => String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, limit) || "غير مسجل";
    const details = test ? "" : [
      "اسم العميل: " + clean(request.name, 80),
      "رقم الجوال: " + clean(request.phone, 24),
      "البريد الإلكتروني: " + clean(request.email, 254),
      "مدة الاشتراك: " + clean(request.months, 3) + " شهر",
      "المبلغ: " + clean(request.amount, 8) + " ريال",
      "مرجع التحويل: " + (request.reference ? clean(request.reference, 80) : "لم يُضف")
    ].join(" | ");
    return {
      title: test ? "اختبار تنبيهات الاشتراك" : "طلب اشتراك جديد بانتظار المراجعة",
      name: "موقع ورقة",
      time: new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }),
      message: (test
        ? "هذا تنبيه تجريبي من لوحة المالك للتحقق من وصول إشعارات طلبات الاشتراك."
        : "تم حفظ طلب اشتراك في Firebase. يوجد طلب بانتظار المراجعة في لوحة التحكم. هذا التنبيه لا يؤكد وصول الحوالة أو تفعيل الاشتراك.")
        + (details ? "\n" + details : "")
        + "\nافتح لوحة التحكم: https://alatwi777.github.io/waraqa/"
    };
  }
  async function sendOwnerEmailNotice(test = false, request = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      // The recipient is fixed in the EmailJS template, never taken from customer input.
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST", signal: controller.signal, credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: ownerNoticePayload(test, request)
        })
      });
      const serviceMessage = (await response.text()).replace(/\s+/g, " ").slice(0,240);
      if (response.status === 429) return { accepted: false, code: "rate-limited", httpStatus: 429 };
      if (!response.ok) return { accepted: false, code: "http-error", httpStatus: response.status, serviceMessage };
      if (serviceMessage.trim() !== "OK") return { accepted: false, code: "invalid-response" };
      return { accepted: true, code: "accepted" };
    } catch (error) {
      return { accepted: false, code: controller.signal.aborted || error?.name === "AbortError" ? "timeout" : "network" };
    } finally { clearTimeout(timer); }
  }
  function ownerNoticeExplanation(result) {
    if (result.accepted) return "قبلت EmailJS إرسال التنبيه إلى " + OWNER_NOTIFICATION_EMAIL + ". راجع الوارد وغير المرغوب فيه للتأكد من وصوله.";
    const explanations = {
      "timeout": "انتهت مهلة الاتصال بخدمة EmailJS. لم نتأكد من إرسال التنبيه.",
      "network": "تعذر اتصال المتصفح بخدمة EmailJS. تحقق من الاتصال ثم أعد المحاولة.",
      "rate-limited": "بلغت حد الإرسال أو حدّدت الخدمة المحاولات مؤقتًا (HTTP 429). راجع EmailJS قبل إعادة المحاولة.",
      "invalid-response": "لم ترجع EmailJS تأكيد إرسال مفهومًا. راجع Email History في حساب الخدمة."
    };
    const detail = result.serviceMessage ? " رد الخدمة: " + result.serviceMessage : "";
    return (explanations[result.code] || "تعذر الإرسال إلى EmailJS" + (result.httpStatus ? " (HTTP " + result.httpStatus + ")" : "") + ".") + detail + " طلبات الاشتراك المحفوظة في لوحة التحكم لا تتأثر.";
  }
  async function notifySavedSubscription(uid, fresh = false) {
    const key = subscriptionNoticeKey(uid);
    const previous = fresh ? {} : noticeState(key);
    if (previous.accepted) return "accepted";
    if (previous.attemptedAt && Date.now() - previous.attemptedAt < 30000) return "retry";
    saveNoticeState(key, { attemptedAt: Date.now(), accepted: false });
    // Read the saved record so retries include its actual data, not edited form fields.
    if (auth?.currentUser?.uid !== uid) return "retry";
    const saved = await firebase.getDoc(firebase.doc(db, "subscriptionRequests", uid));
    if (!saved.exists() || saved.data().status !== "pending" || auth?.currentUser?.uid !== uid) return "retry";
    const result = await sendOwnerEmailNotice(false, saved.data());
    const accepted = result.accepted;
    saveNoticeState(key, { attemptedAt: Date.now(), accepted });
    return accepted ? "accepted" : "retry";
  }
  async function showSavedRequestNotice(uid, fresh, showFeedback) {
    const retry = $("#wa-mail-retry");
    try {
      const result = await notifySavedSubscription(uid, fresh);
      if (auth?.currentUser?.uid !== uid) return;
      retry.hidden = result === "accepted";
      if (result !== "accepted") {
        showFeedback(SUBSCRIPTION_PENDING_MESSAGE + " تم حفظ الطلب، لكن تعذر تأكيد إرسال تنبيه المالك الآن.");
        retry.onclick = async () => {
          if (auth?.currentUser?.uid !== uid) return;
          retry.disabled = true;
          showFeedback(SUBSCRIPTION_PENDING_MESSAGE);
          try { await showSavedRequestNotice(uid, false, showFeedback); }
          finally { retry.disabled = false; }
        };
      }
    } catch {
      // The notification is optional: a saved Firestore request remains successful.
      showFeedback(SUBSCRIPTION_PENDING_MESSAGE + " تم حفظ الطلب، وسيظهر للمالك في لوحة التحكم.");
    }
  }

  function setMessage(text, kind = "") { message.textContent = text; message.className = `wa-message ${kind}`; }
  function authErrorText(error, action) {
    const code = error?.code || "unknown";
    const messages = {
      "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة. راجع العنوان ثم حاول مجددًا.",
      "auth/user-not-found": "لا يوجد حساب بهذا البريد في Firebase Authentication. تأكد أنك تستخدم بريد الحساب نفسه.",
      "auth/too-many-requests": "أوقف Firebase المحاولات مؤقتًا لكثرتها. انتظر قليلًا ثم حاول مجددًا.",
      "auth/network-request-failed": "تعذر الاتصال بخدمة Firebase. تحقق من الإنترنت ثم أعد المحاولة.",
      "auth/unauthorized-domain": "نطاق الموقع غير معتمد في Firebase. أضف alatwi777.github.io ضمن Authentication ثم Settings ثم Authorized domains.",
      "auth/operation-not-allowed": "تسجيل البريد وكلمة المرور غير مفعّل في Firebase Authentication.",
      "auth/invalid-api-key": "مفتاح Firebase غير صالح لهذا المشروع.",
      "auth/api-key-not-valid": "مفتاح Firebase غير صالح لهذا المشروع."
    };
    if (code === "auth/operation-not-allowed") return "تسجيل الدخول بالبريد والرمز غير مفعّل في Firebase Authentication.";
    if (code === "auth/weak-password" || code === "auth/password-does-not-meet-requirements") return "الرمز لا يطابق سياسة كلمة المرور في Firebase. راجع سياسة المشروع.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "البريد أو رمز الدخول غير صحيح.";
    return messages[code] || `تعذر ${action === "reset" ? "إرسال رابط الدخول" : "تسجيل الدخول"} (رمز Firebase: ${code}).`;
  }
  function setBusy(value) { $("#wa-submit").disabled = value; }
  function showGate(title = "تسجيل الدخول") { gate.hidden = false; $("#wa-title").textContent = title; }
  function openAccountPanel() {
    if (auth?.currentUser) {
      $("#wa-form").hidden = true;
$("#wa-plan-email").value = auth.currentUser.email || "";
      $("#wa-plan-message").textContent = "أنت مسجل الدخول. أكمل بيانات الطلب أو سجّل خروجك لتبديل الحساب.";
      $("#wa-plan-message").style.color = "#526a60";
      showGate("الاشتراك والحساب");
    } else {
      $("#wa-form").hidden = false;
showGate("تسجيل الدخول والاشتراك");
    }
  }
  function addAccountChip(email, logout, isAdmin = false) {
    const target = document.querySelector(".header-left");
    if (!target) return;
    let chip = document.getElementById("waraqa-account-chip");
    if (!chip) {
      chip = document.createElement("div"); chip.id = "waraqa-account-chip"; chip.className = "waraqa-account-chip"; target.prepend(chip);
    }
    chip.replaceChildren();
    if (email) {
      const identity = document.createElement("div"); identity.className = "wa-account-identity";
      const caption = document.createElement("small"); caption.textContent = isAdmin ? "حساب المالك" : "حساب المشترك";
      const label = document.createElement("span"); label.title = email; label.textContent = email; label.dir = "ltr";
      identity.append(caption,label); chip.append(identity);
    }
    const actions = document.createElement("div"); actions.className = "wa-account-actions";
    const add = (text, handler, variant = "") => {
      const button = document.createElement("button"); button.type = "button"; button.className = "wa-account-action " + variant;
      button.textContent = text; button.addEventListener("click", handler); actions.append(button);
    };
    add(email ? "الاشتراك" : "دخول / اشتراك", openAccountPanel, "wa-action-primary");
    if (email && isAdmin) add("لوحة التحكم", openAdminDashboard, "wa-action-primary");
    if (email) {
      add("الفاتورة", () => openSubscriptionInvoice(), "wa-action-invoice");
      add("تغيير رمز الدخول", openPinDialog);
      add("تسجيل الخروج", async () => {
        document.getElementById("wa-subscription-invoice")?.close();
        await logout();
      }, "wa-action-logout");
    }
    chip.append(actions);
  }


  function billingProfileKey(email) {
    return "waraqa-billing-profile:v1:" + new URL(".", location.href).pathname + ":" + email;
  }
  function readBillingProfile(email) {
    try {
      const data = JSON.parse(localStorage.getItem(billingProfileKey(email)) || "{}");
      return { name: typeof data.name === "string" ? data.name.slice(0,80) : "", phone: typeof data.phone === "string" ? data.phone.slice(0,24) : "" };
    } catch { return { name: "", phone: "" }; }
  }
  function saveBillingProfile(email, data) {
    try { localStorage.setItem(billingProfileKey(email), JSON.stringify({ name: String(data.name || "").slice(0,80), phone: String(data.phone || "").slice(0,24) })); }
    catch {}
  }
  function invoiceDate(value) {
    return value instanceof Date && Number.isFinite(value.getTime())
      ? new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { timeZone: "Asia/Riyadh", dateStyle: "medium" }).format(value) : "غير مسجل";
  }
  function invoiceModel(email, license, request, profile, now = new Date()) {
    const expiry = asDate(license.expiresAt);
    const linked = request?.status === "activated" && expiry &&
      asDate(request.activatedUntil)?.getTime() === expiry.getTime();
    const recorded = linked && Number.isInteger(request.amount) && request.amount >= 0;
    const monthly = ["1 شهر","30 يوم"].includes(String(license.plan || "").trim());
    const amount = recorded ? request.amount : monthly ? 29 : null;
    return {
      email, name: profile.name || request?.name || "", phone: profile.phone || request?.phone || "",
      plan: String(license.plan || "غير مسجلة"), expiry, created: asDate(license.createdAt), issued: now,
      status: license.active === true && expiry && expiry > now ? "نشط" : expiry && expiry <= now ? "منتهي" : "موقوف",
      remaining: expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000)) : 0,
      amount, priceLabel: recorded ? "مبلغ الطلب المسجل" : "السعر المعلن للباقة",
      paymentNote: recorded ? "تم تفعيل طلب الاشتراك بعد مراجعة التحويل." : "القيمة وفق الباقة المعروضة؛ هذا المستند لا يؤكد وصول دفعة مالية.",
      transferReference: recorded ? String(request.reference || "غير مسجل") : "غير مسجل"
    };
  }
  function invoiceEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  }
  function buildSubscriptionInvoice(model, logoSrc) {
    const e = invoiceEscape;
    const money = model.amount === null ? "غير مسجل" : model.amount.toLocaleString("ar-SA") + " ريال";
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>فاتورة اشتراك ورقة</title><style>
      *{box-sizing:border-box}body{margin:0;background:#fff;color:#172d2c;font:15px Tahoma,Arial,sans-serif;line-height:1.8}.invoice{max-width:780px;margin:24px auto;padding:30px;border:1px solid #e5dfce;border-radius:18px}
      .invoice-head{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:2px solid #c6a04e;padding-bottom:20px;margin-bottom:22px}.invoice-head img{width:94px;height:77px;object-fit:contain;background:#000;border-radius:12px}.invoice-head h1{font-size:26px;margin:0;color:#173d35}.invoice-head p{margin:2px 0;color:#66736e;font-size:12px}
      .invoice-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.invoice-section{padding:16px;background:#faf9f5;border:1px solid #ebe6da;border-radius:12px}.invoice-section h2{font-size:16px;margin:0 0 10px;color:#85641e}.line{margin:7px 0;overflow-wrap:anywhere}.line b{display:block;font-size:11px;color:#687770;font-weight:normal}.line span{font-weight:bold}
      table{width:100%;border-collapse:collapse;margin:25px 0 12px}th,td{text-align:right;padding:13px;border-bottom:1px solid #e8e5dc}th{background:#163e33;color:#fff;font-size:13px}.invoice-total{text-align:left;font-size:21px;font-weight:bold;color:#173e34}.invoice-note{font-size:12px;color:#66746e;border-top:1px solid #e5dfce;margin-top:24px;padding-top:16px}footer{text-align:center;font-size:12px;color:#75817a;margin-top:22px}
      @page{size:A4;margin:14mm}@media print{body{font-size:12px;print-color-adjust:exact;-webkit-print-color-adjust:exact}.invoice{margin:0;padding:10px;border:0;max-width:none}.invoice-section,table,.invoice-head{break-inside:avoid}footer{margin-top:24px}}
      </style></head><body><article class="invoice"><header class="invoice-head"><img src="${e(logoSrc)}" alt="شعار ورقة"><div><h1>فاتورة اشتراك ورقة</h1><p>تاريخ إصدار المستند: ${e(invoiceDate(model.issued))}</p><p>مساحة المعلم</p></div></header>
      <div class="invoice-grid"><section class="invoice-section"><h2>بيانات العميل</h2><div class="line"><b>الاسم</b><span>${e(model.name || "غير مسجل")}</span></div><div class="line"><b>البريد الإلكتروني</b><span dir="ltr">${e(model.email)}</span></div><div class="line"><b>رقم الجوال</b><span dir="ltr">${e(model.phone || "غير مسجل")}</span></div></section>
      <section class="invoice-section"><h2>بيانات الاشتراك</h2><div class="line"><b>الحالة</b><span>${e(model.status)}</span></div><div class="line"><b>تاريخ إنشاء الاشتراك</b><span>${e(invoiceDate(model.created))}</span></div><div class="line"><b>صالح حتى</b><span>${e(invoiceDate(model.expiry))}</span></div><div class="line"><b>المدة المتبقية</b><span>${e(model.remaining)} يوم</span></div></section></div>
      <table><thead><tr><th>الخدمة</th><th>الخطة</th><th>${e(model.priceLabel)}</th></tr></thead><tbody><tr><td>اشتراك منصة ورقة</td><td>${e(model.plan)}</td><td>${e(money)}</td></tr></tbody></table><div class="invoice-total">${e(model.priceLabel)}: ${e(money)}</div>
      <div class="invoice-note"><div>مرجع التحويل: ${e(model.transferReference)}</div><p>${e(model.paymentNote)}</p></div><footer>ورقة · alatwi777.github.io/waraqa</footer></article></body></html>`;
  }
  async function loadInvoiceRecord(user, email) {
    const owner = isAdminAccount(user);
    if (!owner && email !== String(user.email || "").toLowerCase()) throw new Error("invoice-forbidden");
    let snap = await firebase.getDoc(firebase.doc(db, "licenses", email));
    if (!snap.exists() && !owner) snap = await firebase.getDoc(firebase.doc(db, "licenses", user.uid));
    if (!snap.exists()) throw new Error("invoice-missing");
    let request = null;
    if (owner) {
      const records = await firebase.getDocs(firebase.collection(db, "subscriptionRequests"));
      const candidates = records.docs.map(doc => doc.data()).filter(data => String(data.email || "").toLowerCase() === email && data.status === "activated");
      const expiryTime = asDate(snap.data().expiresAt)?.getTime();
      candidates.sort((a,b) => Number(asDate(b.activatedUntil)?.getTime() === expiryTime) - Number(asDate(a.activatedUntil)?.getTime() === expiryTime) || (asDate(b.reviewedAt)?.getTime() || 0) - (asDate(a.reviewedAt)?.getTime() || 0));
      request = candidates[0] || null;
    } else {
      try {
        const own = await firebase.getDoc(firebase.doc(db, "subscriptionRequests", user.uid));
        if (own.exists() && String(own.data().email || "").toLowerCase() === email) request = own.data();
      } catch (error) { if (error.code !== "permission-denied") throw error; }
    }
    if (auth.currentUser?.uid !== user.uid) throw new Error("invoice-session-changed");
    const profile = readBillingProfile(email);
    if (!profile.name) profile.name = request?.name || (email === String(user.email || "").toLowerCase() ? user.displayName || "" : "");
    if (!profile.phone) profile.phone = request?.phone || "";
    return invoiceModel(email, snap.data(), request, profile);
  }
  async function openSubscriptionInvoice() {
    const user = auth?.currentUser;
    if (!user?.email || user.isAnonymous) return;
    if (document.getElementById("wa-subscription-invoice")) return;
    const dialog = document.createElement("dialog");
    dialog.id = "wa-subscription-invoice"; dialog.dir = "rtl";
    dialog.setAttribute("aria-labelledby", "wa-invoice-title");
    dialog.innerHTML = `<div class="wa-invoice-toolbar"><div><small>ورقة · الاشتراكات</small><h2 id="wa-invoice-title">الفاتورة</h2></div><button type="button" class="wa-invoice-close" aria-label="إغلاق الفاتورة">×</button></div>
      <p id="wa-invoice-status" role="status">جارٍ تحميل بيانات الاشتراك…</p>
      <form id="wa-invoice-form"><label id="wa-invoice-select-wrap" hidden>اشتراك العميل<select id="wa-invoice-select"></select></label><div class="wa-invoice-contact"><label>اسم العميل<input name="customerName" maxlength="80" autocomplete="name" required></label><label>رقم الجوال<input name="customerPhone" type="tel" maxlength="24" autocomplete="tel" required></label></div>
      <p class="wa-invoice-hint">أكمل البيانات إن لزم. الاسم والجوال اللذان تعدلهما هنا يُحفظان على هذا المتصفح.</p>
      <div id="wa-invoice-summary"></div><div class="wa-invoice-actions"><button type="submit" id="wa-invoice-print" disabled>طباعة الفاتورة / حفظ PDF</button></div></form>`;
    const invoiceLogo = document.createElement("img");
    invoiceLogo.src = $(".wa-brand-logo").src; invoiceLogo.alt = "شعار ورقة";
    dialog.querySelector(".wa-invoice-toolbar>div").prepend(invoiceLogo);
    const form = dialog.querySelector("form"), status = dialog.querySelector("#wa-invoice-status");
    const summary = dialog.querySelector("#wa-invoice-summary"), print = dialog.querySelector("#wa-invoice-print");
    let model = null, generation = 0;
    const close = () => dialog.close();
    dialog.querySelector(".wa-invoice-close").onclick = close;
    dialog.addEventListener("close", () => { generation++; model = null; form.reset(); dialog.remove(); }, { once: true });
    const load = async email => {
      const token = ++generation; model = null; print.disabled = true; summary.replaceChildren(); status.textContent = "جارٍ تحميل بيانات الاشتراك…";
      try {
        const result = await loadInvoiceRecord(user, email);
        if (!dialog.isConnected || token !== generation) return;
        model = result;
        form.elements.customerName.value = model.name; form.elements.customerPhone.value = model.phone;
        const cards = [
          ["البريد", model.email], ["الخطة", model.plan], ["حالة الاشتراك", model.status],
          ["صالح حتى", invoiceDate(model.expiry)], [model.priceLabel, model.amount === null ? "غير مسجل" : model.amount + " ريال"]
        ];
        for (const [label,value] of cards) {
          const card = document.createElement("div"), caption = document.createElement("small"), content = document.createElement("strong");
          caption.textContent = label; content.textContent = value; card.append(caption,content); summary.append(card);
        }
        status.textContent = model.paymentNote; print.disabled = false;
      } catch (error) {
        if (!dialog.isConnected || token !== generation) return;
        status.textContent = error.message === "invoice-missing" ? "لا يوجد سجل اشتراك لهذا الحساب لعرض فاتورته." : "تعذر تحميل الفاتورة. تحقق من الاتصال وأعد فتحها.";
      }
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (!model || auth.currentUser?.uid !== user.uid || !form.reportValidity()) return;
      const name = form.elements.customerName.value.trim(), phone = form.elements.customerPhone.value.trim();
      if (!name || !phone) { status.textContent = "أكمل الاسم ورقم الجوال قبل الطباعة."; return; }
      model = { ...model, name, phone, issued: new Date() };
      saveBillingProfile(model.email, model);
      const popup = window.open("", "_blank");
      if (!popup) { status.textContent = "اسمح بفتح نافذة الطباعة لهذا الموقع ثم حاول مجددًا."; return; }
      popup.document.open(); popup.document.write(buildSubscriptionInvoice(model, $(".wa-brand-logo").src)); popup.document.close();
      popup.opener = null;
      const image = popup.document.querySelector("img");
      const ready = image?.decode ? image.decode().catch(() => {}) : Promise.resolve();
      ready.then(() => { if (!popup.closed) { popup.focus(); popup.print(); } });
      status.textContent = "فُتحت نافذة الطباعة. يمكنك اختيار «حفظ PDF» من قائمة الطابعات.";
    };
    document.body.appendChild(dialog); dialog.showModal();
    if (isAdminAccount(user)) {
      const wrap = dialog.querySelector("#wa-invoice-select-wrap"), select = dialog.querySelector("#wa-invoice-select");
      wrap.hidden = false;
      try {
        const licenses = await firebase.getDocs(firebase.collection(db, "licenses"));
        if (!dialog.isConnected || auth.currentUser?.uid !== user.uid) return;
        const emails = [...new Set(licenses.docs.map(doc => String(doc.data().email || (doc.id.includes("@") ? doc.id : "")).trim().toLowerCase()).filter(Boolean))].sort();
        if (!emails.length) { status.textContent = "لا توجد اشتراكات ببريد مسجل لعرض الفاتورة."; return; }
        for (const email of emails) { const option = document.createElement("option"); option.value = email; option.textContent = email; select.append(option); }
        select.onchange = () => load(select.value);
        await load(select.value);
      } catch { status.textContent = "تعذر تحميل قائمة الاشتراكات."; }
    } else await load(String(user.email).toLowerCase());
  }

  function normalizePin(value) {
    return value.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776));
  }
  function openPinDialog() {
    const user = auth?.currentUser;
    if (!user?.email || user.isAnonymous) return;
    if (document.getElementById("wa-pin-dialog")) return;
    const dialog = document.createElement("dialog");
    dialog.id = "wa-pin-dialog";
    dialog.dir = "rtl";
    dialog.setAttribute("aria-labelledby", "wa-pin-title");
    dialog.innerHTML = `
      <style>
        #wa-pin-dialog{width:min(460px,calc(100% - 28px));padding:26px;border:1px solid #d4af37;border-radius:22px;background:#111;color:#fff7df;font:inherit;box-shadow:0 20px 70px #0008}
        #wa-pin-dialog::backdrop{background:#0009}
        #wa-pin-dialog h2{margin:0 0 12px;color:#e5c15c}
        #wa-pin-dialog label{display:block;margin:16px 0;font-weight:bold}
        #wa-pin-dialog input{display:block;box-sizing:border-box;width:100%;padding:12px;margin-top:6px;border:1px solid #d4af37;border-radius:10px;background:#fffbed;color:#161616;font:inherit;direction:ltr}
        #wa-pin-dialog .pin-actions{display:flex;gap:10px;margin-top:16px}
        #wa-pin-dialog button{padding:12px 16px;border:1px solid #d4af37;border-radius:10px;font:inherit;cursor:pointer;background:#d4af37;color:#111}
        #wa-pin-dialog button[type=button]{background:transparent;color:#fff7df}
        #wa-pin-dialog button:disabled{opacity:.5;cursor:wait}
        #wa-pin-status{line-height:1.7;min-height:28px}
      </style>
      <h2 id="wa-pin-title">تغيير رمز الدخول</h2>
      <p>اختر رمزًا جديدًا من ٦ أرقام. ستستخدمه في الدخول القادم.</p>
      <form id="wa-change-pin-form">
        <label>الرمز الحالي<input name="current" type="password" autocomplete="current-password" required></label>
        <label>الرمز الجديد<input name="next" type="password" inputmode="numeric" autocomplete="new-password" minlength="6" maxlength="6" required></label>
        <label>تأكيد الرمز الجديد<input name="confirm" type="password" inputmode="numeric" autocomplete="new-password" minlength="6" maxlength="6" required></label>
        <p id="wa-pin-status" role="status" aria-live="polite"></p>
        <div class="pin-actions"><button type="submit">حفظ الرمز</button><button type="button" id="wa-pin-close">إلغاء</button></div>
      </form>`;
    let busy = false;
    const form = dialog.querySelector("form");
    const status = dialog.querySelector("#wa-pin-status");
    const controls = () => dialog.querySelectorAll("input,button");
    const close = () => { if (!busy) dialog.close(); };
    dialog.querySelector("#wa-pin-close").onclick = close;
    dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
    dialog.addEventListener("close", () => { form.reset(); dialog.remove(); }, { once: true });
    form.onsubmit = async event => {
      event.preventDefault();
      const current = form.elements.current.value;
      const next = normalizePin(form.elements.next.value);
      const confirm = normalizePin(form.elements.confirm.value);
      if (!/^[0-9]{6}$/.test(next)) { status.textContent = "الرمز الجديد يجب أن يتكوّن من ٦ أرقام."; return; }
      if (next !== confirm) { status.textContent = "تأكيد الرمز لا يطابق الرمز الجديد."; return; }
      if (next === current) { status.textContent = "اختر رمزًا جديدًا مختلفًا عن الحالي."; return; }
      busy = true; controls().forEach(control => control.disabled = true);
      status.textContent = "جارٍ حفظ الرمز…";
      try {
        await authSdk.reauthenticateWithCredential(user, authSdk.EmailAuthProvider.credential(user.email, current));
        if (auth.currentUser?.uid !== user.uid) throw new Error("session-changed");
        await authSdk.updatePassword(user, next);
        form.reset();
        status.textContent = "تم تغيير رمز الدخول بنجاح.";
        form.querySelector('button[type="submit"]').hidden = true;
        dialog.querySelector("#wa-pin-close").textContent = "إغلاق";
        form.querySelectorAll("input").forEach(input => input.closest("label").hidden = true);
      } catch (error) {
        status.textContent = error.message === "session-changed" ? "تغيّر الحساب. أغلق النافذة وأعد تسجيل الدخول." : authErrorText(error, "change");
      } finally {
        busy = false; controls().forEach(control => control.disabled = false);
      }
    };
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  function adminStatus(text, error = false) {
    const node = document.getElementById("wa-admin-message");
    if (!node) return;
    node.textContent = text;
    node.className = "wa-admin-message" + (error ? " error" : "");
  }

  function generateAccessPin() {
    const value = new Uint32Array(1);
    const limit = Math.floor(4294967296 / 900000) * 900000;
    do { crypto.getRandomValues(value); } while (value[0] >= limit);
    return String(100000 + value[0] % 900000);
  }
  function requireOwner(uid) {
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser) || (uid && auth.currentUser.uid !== uid)) {
      const error = new Error("owner-session-changed"); error.code = "waraqa/owner-session-changed"; throw error;
    }
    return auth.currentUser.uid;
  }
  async function provisionSubscriber(email, pin) {
    const ownerUid = requireOwner();
    if (!/^[0-9]{6}$/.test(pin)) { const error = new Error("invalid-pin"); error.code = "waraqa/invalid-pin"; throw error; }
    const secondaryApp = firebase.initializeApp(firebaseConfig, "waraqa-provision-" + (++provisioningSequence));
    let secondaryAuth;
    try {
      secondaryAuth = authSdk.initializeAuth(secondaryApp, { persistence: authSdk.inMemoryPersistence });
      try {
        await authSdk.createUserWithEmailAndPassword(secondaryAuth, email, pin);
      } catch (error) {
        if (error.code !== "auth/email-already-in-use") throw error;
        // A retry after an interrupted activation may reuse the account just created.
        // Authenticate with the supplied code; never reset an existing user's password.
        try { await authSdk.signInWithEmailAndPassword(secondaryAuth, email, pin); }
        catch (loginError) {
          if (!["auth/invalid-credential","auth/wrong-password","auth/user-not-found"].includes(loginError.code)) throw loginError;
          const existing = new Error("existing-account"); existing.code = "waraqa/existing-account"; throw existing;
        }
      }
      requireOwner(ownerUid);
    } finally {
      if (secondaryAuth) { try { await authSdk.signOut(secondaryAuth); } catch {} }
      try { await firebase.deleteApp(secondaryApp); } catch {}
    }
  }
  function provisioningError(error) {
    if (error.code === "waraqa/existing-account") return "البريد مسجّل مسبقًا ولم يتغيّر رمزه. استخدم «تفعيل حساب موجود» للاشتراك فقط؛ لن يعمل الرمز الجديد لهذا الحساب.";
    if (error.code === "waraqa/invalid-pin") return "أدخل رمزًا من ٦ أرقام أو اضغط «توليد رمز».";
    if (error.code === "waraqa/owner-session-changed") return "تغيّر حساب المالك. أعد تسجيل الدخول قبل متابعة التفعيل.";
    if (error.code === "waraqa/request-changed") return "الطلب تغيّر أو تمت معالجته. حدّث قائمة الطلبات قبل المحاولة.";
    if (error.code === "permission-denied") return "تعذر حفظ التفعيل في Firestore. راجع القواعد وأعد المحاولة بالرمز نفسه؛ قد يكون حساب الدخول قد أُنشئ.";
    return "لم يكتمل التفعيل (" + (error.code || "خطأ") + "). " + authErrorText(error, "login") + " إذا أُنشئ الحساب، أعد المحاولة بالرمز نفسه.";
  }
  function setProvisionBusy(value) {
    adminProvisionBusy = value;
    document.querySelectorAll("#wa-admin-overlay .wa-provision-control, #wa-admin-form input, #wa-admin-form button")
      .forEach(control => control.disabled = value);
  }
  function emailQuotaModel(snapshot, now = Date.now()) {
    if (!snapshot || !Number.isInteger(snapshot.limit) || snapshot.limit <= 0 || snapshot.limit > 10000000 ||
        !Number.isInteger(snapshot.used) || snapshot.used < 0 || snapshot.used > 10000000 ||
        !Number.isFinite(snapshot.updatedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.resetDate || "")) return null;
    const resetAt = new Date(snapshot.resetDate + "T00:00:00+03:00").getTime();
    if (!Number.isFinite(resetAt)) return null;
    const expired = now >= resetAt, stale = now - snapshot.updatedAt > 86400000;
    const remaining = Math.max(0, snapshot.limit - snapshot.used), percent = Math.min(100, snapshot.used / snapshot.limit * 100);
    return { ...snapshot, remaining, percent, expired, stale,
      tone: expired ? "unknown" : remaining === 0 || percent >= 95 ? "danger" : percent >= 80 ? "warning" : "normal" };
  }
  function emailQuotaKey(ownerUid) {
    return "waraqa-emailjs-quota:v1:" + new URL(".", location.href).pathname + ":" + ownerUid;
  }
  function readEmailQuota() {
    try { return emailQuotaModel(JSON.parse(localStorage.getItem(emailQuotaKey(requireOwner())) || "null")); }
    catch { return null; }
  }
  function renderEmailQuota(section) {
    const quota = readEmailQuota(), number = value => Number(value).toLocaleString("ar-SA");
    const value = selector => section.querySelector(selector);
    value("#wa-quota-left").textContent = quota && !quota.expired ? number(quota.remaining) : "—";
    value("#wa-quota-used").textContent = quota && !quota.expired ? number(quota.used) : "—";
    value("#wa-quota-limit").textContent = quota ? number(quota.limit) : "—";
    section.dataset.tone = quota?.tone || "unknown";
    value("#wa-quota-fill").style.width = quota && !quota.expired ? quota.percent + "%" : "0%";
    const progress = value("#wa-quota-progress");
    if (quota && !quota.expired) progress.setAttribute("aria-valuenow", String(Math.round(quota.percent)));
    else progress.removeAttribute("aria-valuenow");
    const message = !quota ? "لم يُسجّل الرصيد بعد. افتح EmailJS وأدخل الاستهلاك وتاريخ التجدد الظاهرين في حسابك."
      : quota.expired ? "حلّ موعد تجدد الرصيد. حدّث الأرقام من EmailJS؛ لا نفترض أن الاستهلاك عاد إلى الصفر."
      : quota.remaining === 0 ? "الرصيد المسجّل نفد. راجع EmailJS قبل الاعتماد على تنبيهات جديدة؛ طلبات الاشتراك تبقى في لوحة التحكم."
      : quota.percent >= 95 ? "الرصيد المسجّل قريب جدًا من النفاد. راجع الحساب الآن."
      : quota.percent >= 80 ? "استهلكت ٨٠٪ أو أكثر حسب آخر تحديث. راقب الرصيد قبل نفاده."
      : "الأرقام حسب آخر تحديث أدخلته؛ قد تكون رسائل أخرى قد استُهلكت بعده.";
    value("#wa-quota-alert").textContent = message + (quota?.stale && !quota.expired ? " مضى أكثر من يوم على التحديث؛ يُنصح بمراجعة الرصيد." : "");
    value("#wa-quota-updated").textContent = quota ? "آخر تحديث يدوي: " + new Date(quota.updatedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" }) + " · التجدد: " + quota.resetDate : "لم يُحدّث بعد · لا توجد مزامنة آلية مع EmailJS";
    value("#wa-quota-input-limit").value = quota?.limit ?? 200;
    value("#wa-quota-input-used").value = quota?.used ?? "";
    value("#wa-quota-input-reset").value = quota?.resetDate ?? "";
  }
  function mountEmailQuotaPanel(overlay) {
    let section = overlay.querySelector("#wa-email-quota");
    if (!section) {
      section = document.createElement("section"); section.id = "wa-email-quota"; section.className = "wa-email-quota";
      section.setAttribute("aria-labelledby", "wa-quota-heading");
      section.innerHTML = '<div class="wa-quota-heading"><div><span class="wa-admin-eyebrow">متابعة التنبيهات</span><h3 id="wa-quota-heading">رصيد رسائل EmailJS</h3></div><a class="wa-quota-link" href="https://dashboard.emailjs.com/admin" target="_blank" rel="noopener noreferrer">عرض الرصيد الرسمي ↗</a></div><p class="wa-quota-description">متابعة يدوية لآخر رصيد من حسابك. حدّثه دوريًا؛ هذه الأرقام ليست قراءة مباشرة من EmailJS، وتُحفظ في متصفح المالك هذا.</p><div class="wa-quota-numbers"><div><span>المتبقي حسب آخر تحديث</span><strong id="wa-quota-left">—</strong></div><div><span>المستهلك حسب آخر تحديث</span><strong id="wa-quota-used">—</strong></div><div><span>حد الدورة المسجّل</span><strong id="wa-quota-limit">—</strong></div></div><div id="wa-quota-progress" class="wa-quota-progress" role="progressbar" aria-label="نسبة الاستهلاك المسجلة" aria-valuemin="0" aria-valuemax="100"><div id="wa-quota-fill"></div></div><p id="wa-quota-alert" class="wa-quota-alert" role="status"></p><small id="wa-quota-updated"></small><details class="wa-quota-details"><summary>تحديث أرقام الرصيد</summary><form id="wa-quota-form"><label>حد الرسائل في الدورة<input id="wa-quota-input-limit" type="number" min="1" max="10000000" step="1" required></label><label>المستهلك في EmailJS<input id="wa-quota-input-used" type="number" min="0" max="10000000" step="1" required placeholder="انسخ الرقم من حسابك"></label><label>تاريخ التجدد القادم<input id="wa-quota-input-reset" type="date" required></label><button type="submit">حفظ التحديث</button></form><p id="wa-quota-form-status" role="status"></p></details>';
      overlay.querySelector(".wa-admin-mail").before(section);
      section.querySelector("#wa-quota-form").onsubmit = event => {
        event.preventDefault();
        const ownerUid = requireOwner(), form = event.currentTarget;
        if (!form.reportValidity()) return;
        const limit = Number(section.querySelector("#wa-quota-input-limit").value), used = Number(section.querySelector("#wa-quota-input-used").value), resetDate = section.querySelector("#wa-quota-input-reset").value;
        const snapshot = { limit, used, resetDate, updatedAt: Date.now() }, model = emailQuotaModel(snapshot);
        const status = section.querySelector("#wa-quota-form-status");
        if (!model || model.expired) { status.textContent = "أدخل أرقامًا صحيحة وتاريخ تجدد قادمًا كما يظهر في EmailJS."; return; }
        try {
          localStorage.setItem(emailQuotaKey(ownerUid), JSON.stringify(snapshot));
          renderEmailQuota(section);
          status.textContent = "حُفظ آخر رصيد أدخلته. حدّثه مجددًا بعد مراجعة EmailJS.";
        } catch { status.textContent = "تعذر حفظ الرصيد في هذا المتصفح."; }
      };
    }
    renderEmailQuota(section);
  }

  let receiptDatabasePromise = null;
  function receiptDatabase() {
    if (!receiptDatabasePromise) receiptDatabasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("waraqa-owner-messages-v1", 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore("keys");
        database.createObjectStore("messages");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { receiptDatabasePromise = null; reject(request.error); };
    });
    return receiptDatabasePromise;
  }
  async function receiptKey(ownerUid) {
    const database = await receiptDatabase();
    const candidate = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("keys", "readwrite"), store = transaction.objectStore("keys");
      let key;
      const request = store.get(ownerUid);
      request.onsuccess = () => { key = request.result || candidate; if (!request.result) store.put(key, ownerUid); };
      transaction.oncomplete = () => resolve(key);
      transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error("receipt-key"));
    });
  }
  async function receiptRecord(ownerUid, email, value, remove = false) {
    const database = await receiptDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("messages", value || remove ? "readwrite" : "readonly");
      const store = transaction.objectStore("messages"), id = JSON.stringify([ownerUid, email]);
      const request = remove ? store.delete(id) : value ? store.put(value, id) : store.get(id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error("receipt-record"));
    });
  }
  async function saveOwnerReceipt(email, pin, expiresAt) {
    if (!pin) return;
    const ownerUid = requireOwner(), key = await receiptKey(ownerUid);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const context = new TextEncoder().encode(JSON.stringify([ownerUid, email]));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: context }, key,
      new TextEncoder().encode(JSON.stringify({ pin, savedAt: Date.now(), expiresAt: expiresAt.getTime() })));
    requireOwner(ownerUid);
    await receiptRecord(ownerUid, email, { iv, encrypted });
  }
  async function readOwnerReceipt(email) {
    const ownerUid = requireOwner(), record = await receiptRecord(ownerUid, email);
    if (!record) return null;
    const key = await receiptKey(ownerUid);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv,
      additionalData: new TextEncoder().encode(JSON.stringify([ownerUid, email])) }, key, record.encrypted);
    requireOwner(ownerUid);
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
  function closeOwnerMessages() {
    const overlay = document.getElementById("wa-owner-messages");
    if (overlay) { overlay.classList.remove("open"); overlay.querySelector("tbody")?.replaceChildren(); }
  }
  async function openOwnerMessages() {
    const ownerUid = requireOwner();
    let overlay = document.getElementById("wa-owner-messages");
    if (!overlay) {
      overlay = document.createElement("section"); overlay.id = "wa-owner-messages"; overlay.className = "wa-admin-overlay";
      overlay.style.zIndex = "2147483002";
      overlay.innerHTML = '<div class="wa-admin-panel" role="dialog" aria-modal="true" aria-labelledby="wa-owner-messages-title"><div class="wa-admin-head"><h2 id="wa-owner-messages-title">رسائل العملاء</h2><button type="button" class="wa-admin-close" aria-label="إغلاق">×</button></div><p>الرموز محفوظة مشفّرة في متصفح المالك هذا فقط. إذا غيّر العميل رمزه لاحقًا، فقد لا يعمل الرمز المحفوظ. الرموز القديمة التي لم تُحفظ هنا غير متاحة.</p><p role="status" id="wa-owner-messages-status"></p><div class="wa-admin-table-wrap"><table class="wa-admin-table"><thead><tr><th>البريد الإلكتروني</th><th>الرمز المحفوظ</th><th>حالة الاشتراك</th><th>الرسالة</th></tr></thead><tbody></tbody></table></div></div>';
      overlay.querySelector(".wa-admin-close").onclick = closeOwnerMessages;
      overlay.onclick = event => { if (event.target === overlay) closeOwnerMessages(); };
      document.body.appendChild(overlay);
    }
    overlay.classList.add("open");
    const status = overlay.querySelector("#wa-owner-messages-status"), body = overlay.querySelector("tbody");
    status.textContent = "جارٍ تحميل العملاء…"; body.replaceChildren();
    try {
      const snapshot = await firebase.getDocs(firebase.collection(db, "licenses"));
      requireOwner(ownerUid);
      if (!overlay.classList.contains("open")) return;
      const records = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      records.sort((a,b) => String(a.data.email || a.id).localeCompare(String(b.data.email || b.id)));
      for (const record of records) {
        const email = String(record.data.email || record.id).trim().toLowerCase();
        let saved = null, failed = false;
        try { saved = await readOwnerReceipt(email); } catch { failed = true; }
        requireOwner(ownerUid);
        if (!overlay.classList.contains("open")) return;
        const row = document.createElement("tr");
        setCell(row, email);
        const pinCell = document.createElement("td"), pin = document.createElement("input");
        pin.type = "password"; pin.readOnly = true; pin.autocomplete = "off";
        pin.setAttribute("aria-label", "الرمز المحفوظ لـ " + email);
        pin.style.cssText = "width:90px;padding:8px;border:1px solid #cbd9d1;border-radius:8px;direction:ltr";
        if (saved?.pin) {
          pin.value = saved.pin;
          const reveal = document.createElement("button"); reveal.type = "button"; reveal.className = "wa-receipt-button"; reveal.textContent = "إظهار";
          reveal.onclick = () => { pin.type = pin.type === "password" ? "text" : "password"; reveal.textContent = pin.type === "password" ? "إظهار" : "إخفاء"; };
          pinCell.append(pin, reveal);
        } else pinCell.textContent = failed ? "تعذر فتح الرمز المحفوظ" : "غير محفوظ في هذا المتصفح";
        row.appendChild(pinCell);
        const expiry = asDate(record.data.expiresAt);
        const active = record.data.active === true && expiry?.getTime() > Date.now();
        setCell(row, active ? "مفعّل" : record.data.active === false ? "موقوف" : "منتهي");
        const action = document.createElement("td");
        if (saved?.pin) {
          const copy = document.createElement("button"); copy.type = "button"; copy.textContent = "نسخ الرسالة"; copy.className = "wa-receipt-button";
          copy.onclick = async () => {
            requireOwner(ownerUid);
            const message = "بيانات حسابك في ورقة:\nالبريد: " + email + "\nرمز الدخول المحفوظ عند التفعيل: " + pin.value +
              "\nإذا سبق أن غيّرت الرمز، استخدم الرمز الذي اخترته.\nرابط الموقع: https://alatwi777.github.io/waraqa/";
            try { await navigator.clipboard.writeText(message); copy.textContent = "تم النسخ"; }
            catch { status.textContent = "تعذر النسخ التلقائي. أظهر الرمز وانسخه يدويًا."; }
          };
          action.appendChild(copy);
        } else action.textContent = "—";
        row.appendChild(action); body.appendChild(row);
      }
      status.textContent = records.length ? "عدد العملاء: " + records.length : "لا توجد اشتراكات مسجلة.";
    } catch { status.textContent = "تعذر قراءة العملاء. تحقق من الاتصال وحساب المالك."; }
  }
  async function deleteInactiveLicense(record, email, button) {
    const ownerUid = requireOwner();
    if (!window.confirm("حذف سجل اشتراك " + email + " ورسالته المحفوظة؟ سيبقى حساب الدخول وبيانات العميل المحلية.")) return;
    button.disabled = true;
    try {
      const all = await firebase.getDocs(firebase.collection(db, "licenses"));
      const related = all.docs.filter(doc => String(doc.data().email || doc.id).trim().toLowerCase() === String(email).trim().toLowerCase());
      // Re-read related records so a concurrent activation prevents deletion.
      await firebase.runTransaction(db, async transaction => {
        requireOwner(ownerUid);
        const reference = firebase.doc(db, "licenses", record.id), current = await transaction.get(reference);
        for (const other of related) {
          if (other.id === record.id) continue;
          const sibling = await transaction.get(firebase.doc(db, "licenses", other.id));
          if (sibling.exists() && sibling.data().active === true && asDate(sibling.data().expiresAt)?.getTime() > Date.now()) throw new Error("active-license");
        }
        if (!current.exists()) return;
        const data = current.data(), expiry = asDate(data.expiresAt);
        if (data.active === true && expiry?.getTime() > Date.now()) throw new Error("active-license");
        transaction.delete(reference);
      });
      requireOwner(ownerUid);
      try { await receiptRecord(ownerUid, String(email).trim().toLowerCase(), null, true); } catch {}
      closeOwnerMessages();
      await loadAdminLicenses();
      adminStatus("تم حذف سجل الاشتراك. حساب الدخول والبيانات المحلية لم تُحذف.");
    } catch (error) {
      button.disabled = false;
      adminStatus(error?.message === "active-license" ? "الاشتراك مفعّل الآن. أوقفه قبل الحذف." : "تعذر حذف السجل. تحقق من الاتصال وصلاحية حساب المالك.", true);
    }
  }

  function clearActivationMessage() {
    const box = document.getElementById("wa-activation-message");
    if (box) { box.replaceChildren(); box.hidden = true; }
  }
  async function showActivationMessage(email, pin, expiresAt) {
    const box = document.getElementById("wa-activation-message");
    if (!box) return;
    let receiptSaved = false;
    if (pin) {
      try { await saveOwnerReceipt(email, pin, expiresAt); receiptSaved = true; }
      catch { adminStatus("تم التفعيل، لكن تعذر حفظ رسالة العميل في هذا المتصفح. انسخها الآن قبل إغلاقها.", true); }
    }
    box.replaceChildren(); box.hidden = false;
    const title = document.createElement("strong");
    title.textContent = "تم التفعيل — انسخ الرسالة وأرسلها للعميل بنفسك";
    const text = document.createElement("textarea");
    text.readOnly = true;
    text.rows = 7;
    text.style.cssText = "display:block;width:100%;box-sizing:border-box;margin:10px 0;padding:12px;font:inherit;border:1px solid #cbd9d1;border-radius:10px";
    text.value = "تم تفعيل اشتراكك في ورقة.\nالبريد: " + email +
      (pin ? "\nرمز الدخول: " + pin : "\nادخل باستخدام رمزك الحالي.") +
      "\nصالح حتى: " + expiresAt.toLocaleDateString("ar-SA") +
      "\nرابط الموقع: https://alatwi777.github.io/waraqa/" +
      (pin ? "\nيمكنك تغيير الرمز بعد الدخول من «تغيير رمز الدخول» أعلى الصفحة." : "");
    text.setAttribute("aria-label", "رسالة تفعيل الاشتراك");
    const copy = document.createElement("button");
    copy.type = "button"; copy.className = "wa-admin-form-button"; copy.textContent = "نسخ رسالة التفعيل";
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(text.value); copy.textContent = "تم النسخ"; }
      catch { text.focus(); text.select(); copy.textContent = "حدّدنا الرسالة؛ انسخها يدويًا"; }
    };
    const clear = document.createElement("button");
    clear.type = "button"; clear.textContent = "إخفاء الرسالة"; clear.onclick = clearActivationMessage;
    box.append(title, text, copy, clear);
    if (receiptSaved) {
      const saved = document.createElement("p"); saved.textContent = "حُفظ الرمز في «رسائل العملاء» على هذا المتصفح."; box.appendChild(saved);
    } else if (pin) {
      const warning = document.createElement("p"); warning.textContent = "تعذر حفظ الرسالة في المتصفح. انسخ الرمز الآن قبل إغلاق هذه الرسالة."; warning.style.color = "#a42e2e"; box.appendChild(warning);
    }
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeAdminDashboard() {
    closeOwnerMessages();
    clearActivationMessage();
    document.querySelectorAll("#wa-admin-overlay [data-wa-pin]").forEach(input => { input.value = ""; input.type = "password"; });
    document.getElementById("wa-admin-overlay")?.classList.remove("open");
    if (adminRequestsUnsubscribe) {
      adminRequestsUnsubscribe();
      adminRequestsUnsubscribe = null;
    }
  }
  function openAdminDashboard() {
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    let overlay = document.getElementById("wa-admin-overlay");
    if (!overlay) {
      overlay = document.createElement("section");
      overlay.id = "wa-admin-overlay";
      overlay.className = "wa-admin-overlay";
      overlay.innerHTML = '<div class="wa-admin-panel" role="dialog" aria-modal="true" aria-labelledby="wa-admin-title"><div class="wa-admin-head"><div><h2 id="wa-admin-title">لوحة إدارة اشتراكات ورقة</h2><button type="button" id="wa-owner-messages-open" class="wa-admin-form-button" style="margin-top:10px;padding:10px 16px;border:0;border-radius:10px;background:#0a7058;color:white;font:inherit;cursor:pointer">رسائل العملاء</button><p>أضف البريد ومدة الاشتراك، وستُحفظ الصلاحية في Firebase.</p></div><button type="button" class="wa-admin-close" aria-label="إغلاق">×</button></div><div class="wa-admin-stats"><div class="wa-admin-stat">المشتركون النشطون<b id="wa-admin-active">—</b></div><div class="wa-admin-stat">منتهية أو موقوفة<b id="wa-admin-expired">—</b></div><div class="wa-admin-stat">إجمالي السجلات<b id="wa-admin-total">—</b></div></div><section class="wa-admin-mail" style="margin:16px 0;padding:14px;border:1px solid #dbe8e0;border-radius:14px;background:white"><strong>تنبيهات طلبات الاشتراك</strong><p>البريد: <span dir="ltr">alatwi3@me.com</span> — تنبيه تلقائي عبر EmailJS بعد حفظ طلب الاشتراك.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" id="wa-admin-mail-test" class="wa-admin-form-button" style="padding:10px 14px;border-radius:9px;background:#f1f5f2;color:#24473b">إرسال تنبيه تجريبي</button></div><p id="wa-admin-mail-status" role="status"></p></section><form class="wa-admin-form" id="wa-admin-form"><label>بريد العميل<input id="wa-admin-email" type="email" autocomplete="off" required placeholder="name@example.com"></label><label>مدة الاشتراك بالأيام<input id="wa-admin-days" type="number" min="1" max="3650" step="1" value="30" required></label><label>رمز الحساب الجديد (اختياري للتجديد)<input id="wa-admin-new-pin" data-wa-pin type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="٦ أرقام — فارغ للتجديد فقط"></label><button id="wa-admin-generate-pin" type="button">توليد رمز</button><button type="submit">إضافة / تجديد</button></form><div id="wa-activation-message" hidden style="margin:16px 0;padding:16px;border:1px solid #d4af37;border-radius:14px;background:#fffbed"></div><p id="wa-admin-message" class="wa-admin-message" role="status"></p><div class="wa-admin-table-wrap"><table class="wa-admin-table"><thead><tr><th>البريد / المعرّف</th><th>الخطة</th><th>تاريخ الانتهاء</th><th>المدة المتبقية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="wa-admin-rows"></tbody></table></div><h3>طلبات الاشتراك الجديدة</h3><div class="wa-admin-table-wrap"><table class="wa-admin-table"><thead><tr><th>العميل</th><th>البريد</th><th>الجوال</th><th>المدة والمبلغ</th><th>مرجع التحويل</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="wa-admin-request-rows"></tbody></table></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector(".wa-admin-close").addEventListener("click", closeAdminDashboard);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) closeAdminDashboard(); });
      overlay.querySelector("#wa-admin-form").addEventListener("submit", saveAdminLicense);
      overlay.querySelector("#wa-owner-messages-open").onclick = openOwnerMessages;
      overlay.querySelector("#wa-admin-mail-test").onclick = async event => {
        requireOwner();
        const button = event.currentTarget, status = document.getElementById("wa-admin-mail-status");
        button.disabled = true; status.textContent = "جارٍ اختبار الاتصال بخدمة البريد…";
        try { status.textContent = ownerNoticeExplanation(await sendOwnerEmailNotice(true)); }
        finally { button.disabled = false; }
      };
      overlay.querySelector("#wa-admin-generate-pin").onclick = () => {
        const field = document.getElementById("wa-admin-new-pin");
        field.type = "text"; field.value = generateAccessPin();
      };
    }
    overlay.classList.add("open");
    mountEmailQuotaPanel(overlay);
    loadAdminLicenses();
    loadAdminRequests();
  }
  function asDate(value) {
    return value && typeof value.toDate === "function" ? value.toDate() : null;
  }
  function setCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }
  async function loadAdminLicenses() {
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    adminStatus("جارٍ تحميل الاشتراكات…");
    try {
      const snapshot = await firebase.getDocs(firebase.collection(db, "licenses"));
      const records = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      const now = Date.now();
      const active = records.filter(record => record.data.active === true && asDate(record.data.expiresAt)?.getTime() > now).length;
      document.getElementById("wa-admin-active").textContent = String(active);
      document.getElementById("wa-admin-expired").textContent = String(records.length - active);
      document.getElementById("wa-admin-total").textContent = String(records.length);
      const body = document.getElementById("wa-admin-rows");
      body.replaceChildren();
      records.sort((a,b) => Number(b.data.active === true && asDate(b.data.expiresAt)?.getTime() > now) - Number(a.data.active === true && asDate(a.data.expiresAt)?.getTime() > now) || (asDate(b.data.createdAt)?.getTime() || 0) - (asDate(a.data.createdAt)?.getTime() || 0));
      records.forEach(record => {
        const row = document.createElement("tr");
        row.dataset.licenseId = record.id;
        const email = record.data.email || (record.id.includes("@") ? record.id : "سجل قديم: " + record.id);
        setCell(row, email);
        setCell(row, record.data.plan || "—");
        const expiry = asDate(record.data.expiresAt);
        setCell(row, expiry ? expiry.toLocaleDateString("ar-SA") : "—");
        const remaining = expiry ? Math.ceil((expiry.getTime() - now) / 86400000) : 0;
        setCell(row, expiry && remaining > 0 ? remaining + " يوم" : "منتهية");
        const isActive = record.data.active === true && remaining > 0;
        setCell(row, isActive ? "نشط" : "منتهي / موقوف");
        const actionCell = document.createElement("td");
        if (isActive) {
          const stop = document.createElement("button");
          stop.type = "button"; stop.className = "wa-admin-action"; stop.textContent = "إيقاف";
          stop.addEventListener("click", async () => {
            stop.disabled = true;
            try {
              await firebase.updateDoc(firebase.doc(db, "licenses", record.id), { active: false });
              adminStatus("تم إيقاف اشتراك " + email + ".");
              await loadAdminLicenses();
            } catch (error) {
              stop.disabled = false;
              adminStatus("تعذر تعديل الترخيص. تأكد من نشر قواعد Firestore الجديدة.", true);
            }
          });
          actionCell.appendChild(stop);
        } else {
          const remove = document.createElement("button");
          remove.type = "button"; remove.className = "wa-admin-action"; remove.textContent = "حذف";
          remove.onclick = () => deleteInactiveLicense(record, email, remove);
          actionCell.appendChild(remove);
        }
        row.appendChild(actionCell);
        body.appendChild(row);
      });
      adminStatus("تم تحميل " + records.length + " سجل اشتراك.");
    } catch (error) {
      adminStatus("تعذر قراءة الاشتراكات. انشر قواعد Firestore المحدّثة من مجلد firebase أولًا.", true);
    }
  }
  function loadAdminRequests() {
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    const body = document.getElementById("wa-admin-request-rows");
    if (!body) return;
    if (adminRequestsUnsubscribe) adminRequestsUnsubscribe();
    adminStatus("جارٍ تحميل الطلبات…");
    try {
      adminRequestsUnsubscribe = firebase.onSnapshot(
        firebase.collection(db, "subscriptionRequests"),
        (snapshot) => {
          if (adminProvisionBusy) return;
          const enteredPins = new Map([...body.querySelectorAll("[data-wa-request-pin]")].map(input => [input.dataset.requestId, input.value]));
          const requests = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })).filter(request => request.data.status === "pending");
          requests.sort((a, b) => (asDate(b.data.createdAt)?.getTime() || 0) - (asDate(a.data.createdAt)?.getTime() || 0));
          body.replaceChildren();
          if (!requests.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 7;
            cell.textContent = "لا توجد طلبات جديدة بانتظار التحقق.";
            cell.style.textAlign = "center";
            row.appendChild(cell);
            body.appendChild(row);
          }
          for (const request of requests) {
            const row = document.createElement("tr");
            setCell(row, request.data.name || "—");
            setCell(row, request.data.email || "—");
            setCell(row, request.data.phone || "—");
            setCell(row, (request.data.months || "—") + " شهر · " + (request.data.amount || "—") + " ريال");
            setCell(row, request.data.reference || "—");
            setCell(row, request.data.status === "pending" ? "بانتظار التحقق" : request.data.status === "activated" ? "مفعّل" : "مغلق");
            const action = document.createElement("td");
            if (request.data.status === "pending") {
              const pin = document.createElement("input");
              pin.type = "password"; pin.inputMode = "numeric"; pin.maxLength = 6; pin.autocomplete = "new-password";
              pin.placeholder = "رمز الدخول — ٦ أرقام"; pin.setAttribute("aria-label", "رمز دخول الحساب الجديد");
              pin.dataset.waPin = ""; pin.dataset.waRequestPin = ""; pin.dataset.requestId = request.id;
              pin.className = "wa-provision-control"; pin.value = enteredPins.get(request.id) || "";
              pin.style.cssText = "display:block;width:180px;padding:9px;border:1px solid #b7c9bd;border-radius:8px;margin-bottom:8px;direction:ltr";
              const generate = document.createElement("button");
              generate.type = "button"; generate.className = "wa-admin-form-button wa-provision-control"; generate.textContent = "توليد رمز";
              generate.onclick = () => { pin.type = "text"; pin.value = generateAccessPin(); };
              const activate = document.createElement("button");
              activate.type = "button"; activate.className = "wa-admin-form-button wa-provision-control"; activate.textContent = "تفعيل وإنشاء الحساب";
              activate.onclick = () => activateSubscriptionRequest(request.id, pin.value, false);
              const existing = document.createElement("button");
              existing.type = "button"; existing.className = "wa-admin-form-button wa-provision-control"; existing.textContent = "تفعيل حساب موجود";
              existing.onclick = () => activateSubscriptionRequest(request.id, "", true);
              action.append(pin, generate, activate, existing);
            } else action.textContent = "—";
            row.appendChild(action);
            body.appendChild(row);
          }
          adminStatus("طلبات الاشتراك: " + requests.filter(r => r.data.status === "pending").length + " بانتظار التحقق.");
        },
        (error) => {
          adminRequestsUnsubscribe = null;
          adminStatus("تعذر تحميل طلبات Firestore (" + (error?.code || "خطأ") + ").", true);
        }
      );
    } catch (error) {
      adminStatus("تعذر بدء متابعة طلبات Firestore (" + (error?.code || "خطأ") + ").", true);
    }
  }
  async function activateSubscriptionRequest(uid, rawPin = "", existingAccount = false) {
    if (adminProvisionBusy || !auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    const pin = existingAccount ? "" : normalizePin(rawPin);
    if (!existingAccount && !/^[0-9]{6}$/.test(pin)) { adminStatus("أدخل رمزًا من ٦ أرقام أو اضغط «توليد رمز».", true); return; }
    if (!window.confirm("هل تحققت من وصول المبلغ؟ " + (existingAccount ? "سيُفعّل الاشتراك مع إبقاء رمز الحساب الحالي." : "سيُنشأ حساب الدخول ويُفعّل الاشتراك."))) return;
    const ownerUid = requireOwner();
    setProvisionBusy(true); clearActivationMessage();
    adminStatus("جارٍ تجهيز حساب العميل وتفعيل الاشتراك…");
    let activated = false;
    try {
      const requestRef = firebase.doc(db, "subscriptionRequests", uid);
      const requestSnap = await firebase.getDoc(requestRef);
      if (!requestSnap.exists() || requestSnap.data().status !== "pending") { const error = new Error("request-changed"); error.code = "waraqa/request-changed"; throw error; }
      const request = requestSnap.data();
      const email = String(request.email || "").trim().toLowerCase();
      const months = Number(request.months);
      if (!email || months !== 1) { const error = new Error("request-changed"); error.code = "waraqa/request-changed"; throw error; }
      if (!existingAccount) await provisionSubscriber(email, pin);
      requireOwner(ownerUid);
      const licenseRef = firebase.doc(db, "licenses", email);
      const expiresAt = await firebase.runTransaction(db, async transaction => {
        requireOwner(ownerUid);
        const currentRequest = await transaction.get(requestRef);
        const licenseSnap = await transaction.get(licenseRef);
        if (!currentRequest.exists() || currentRequest.data().status !== "pending" ||
            String(currentRequest.data().email || "").trim().toLowerCase() !== email || Number(currentRequest.data().months) !== months) {
          const error = new Error("request-changed"); error.code = "waraqa/request-changed"; throw error;
        }
        const previous = licenseSnap.exists() ? licenseSnap.data() : null;
        const now = new Date(), priorExpiry = asDate(previous?.expiresAt);
        const start = previous?.active === true && priorExpiry && priorExpiry > now ? priorExpiry : now;
        const expiry = new Date(start.getTime() + months * 30 * 86400000);
        transaction.set(licenseRef, {
          email, active: true, plan: months + " شهر",
          createdAt: previous?.createdAt || firebase.Timestamp.now(),
          expiresAt: firebase.Timestamp.fromDate(expiry)
        }, { merge: true });
        transaction.update(requestRef, {
          status: "activated", reviewedAt: firebase.serverTimestamp(),
          activatedUntil: firebase.Timestamp.fromDate(expiry)
        });
        return expiry;
      });
      requireOwner(ownerUid);
      activated = true;
      await showActivationMessage(email, pin, expiresAt);
      const receipt = document.getElementById("wa-activation-message");
      if (receipt) receipt.dataset.email = email;
      document.querySelectorAll("[data-wa-request-pin]").forEach(input => { if (input.dataset.requestId === uid) input.value = ""; });
      adminStatus("تم التفعيل. رسالة العميل جاهزة للنسخ؛ لم تُرسل تلقائيًا.");
    } catch (error) { adminStatus(provisioningError(error), true); }
    finally { setProvisionBusy(false); }
    if (activated) {
      await loadAdminLicenses();
      loadAdminRequests();
      const savedEmail = document.getElementById("wa-activation-message")?.dataset.email;
      if (savedEmail) {
        const row = [...document.querySelectorAll("#wa-admin-rows tr")].find(row => row.dataset.licenseId === savedEmail);
        row?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }
  async function saveAdminLicense(event) {
    event.preventDefault();
    if (adminProvisionBusy || !auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    const email = document.getElementById("wa-admin-email").value.trim().toLowerCase();
    const days = Number(document.getElementById("wa-admin-days").value);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    if (!email || !Number.isInteger(days) || days < 1 || days > 3650) {
      adminStatus("أدخل بريدًا صحيحًا ومدة بين يوم و١٠ سنوات.", true);
      return;
    }
    const pin = normalizePin(document.getElementById("wa-admin-new-pin").value);
    if (pin && !/^[0-9]{6}$/.test(pin)) { adminStatus("رمز الحساب الجديد يجب أن يكون ٦ أرقام.", true); return; }
    const ownerUid = requireOwner();
    setProvisionBusy(true); clearActivationMessage();
    adminStatus("جارٍ حفظ الاشتراك في Firebase…");
    try {
      const ref = firebase.doc(db, "licenses", email);
      let previous = null;
      try { const existing = await firebase.getDoc(ref); if (existing.exists()) previous = existing.data(); } catch {}
      if (pin) await provisionSubscriber(email, pin);
      requireOwner(ownerUid);
      const now = new Date();
      const priorExpiry = asDate(previous?.expiresAt);
      const start = previous?.active === true && priorExpiry && priorExpiry.getTime() > now.getTime() ? priorExpiry : now;
      const expiresAt = new Date(start.getTime() + days * 86400000);
      await firebase.setDoc(ref, {
        email,
        active: true,
        plan: days + " يوم",
        createdAt: previous?.createdAt || firebase.Timestamp.now(),
        expiresAt: firebase.Timestamp.fromDate(expiresAt)
      }, { merge: true });
      document.getElementById("wa-admin-email").value = "";
      document.getElementById("wa-admin-new-pin").value = "";
      await showActivationMessage(email, pin, expiresAt);
      const receipt = document.getElementById("wa-activation-message");
      if (receipt) receipt.dataset.email = email;
      adminStatus(pin ? "تم إنشاء حساب الدخول وتفعيل الاشتراك." : "تم حفظ الاشتراك فقط؛ يستخدم العميل حسابه ورمزه الحاليين.");
      await loadAdminLicenses();
    } catch (error) {
      adminStatus(provisioningError(error), true);
    } finally {
      setProvisionBusy(false);
    }
  }
  function expirationValue(data) {
    const raw = data?.expiresAt;
    if (raw && typeof raw.toDate === "function") return raw.toDate();
    return null;
  }
  async function checkLicense(user) {
    showGate("التحقق من الاشتراك");
    setMessage("جارٍ التحقق من صلاحية الحساب…");
    try {
      let snap = null;
      const emailId = String(user.email || "").trim().toLowerCase();
      if (emailId) {
        try { snap = await firebase.getDoc(firebase.doc(db, "licenses", emailId)); }
        catch (error) { if (error?.code !== "permission-denied") throw error; }
      }
      if (!snap?.exists()) {
        try { snap = await firebase.getDoc(firebase.doc(db, "licenses", user.uid)); }
        catch (error) { if (error?.code !== "permission-denied") throw error; }
      }
      if (!snap?.exists()) return { valid: false, reason: "لا يوجد اشتراك مفعّل لهذا الحساب." };
      const data = snap.data();
      const expiry = expirationValue(data);
      if (data.active !== true) return { valid: false, reason: "هذا الاشتراك غير مفعّل." };
      if (!expiry || !Number.isFinite(expiry.getTime())) return { valid: false, reason: "سجل الاشتراك يحتاج إلى تاريخ انتهاء صالح (expiresAt) من Firebase." };
      if (expiry.getTime() <= Date.now()) return { valid: false, reason: "انتهت صلاحية الاشتراك في " + expiry.toLocaleDateString("ar-SA") + "." };
      return { valid: true, expiry };
    } catch (error) {
      if (error?.code === "permission-denied") return { valid: false, reason: "لا يوجد اشتراك صالح أو أن الاشتراك انتهى. راجع تفعيل الحساب وتاريخ الانتهاء." };
      return { valid: false, reason: "تعذر الاتصال بـ Firebase للتحقق من الاشتراك. تحقق من الإنترنت ثم أعد المحاولة." };
    }
  }
  let licenseWatchCleanup = null;
  let authorizationVersion = 0;
  let accessNotice = "";
  const lockedWorkspaceElements = new Set();
  function setWorkspaceLocked(locked) {
    if (locked) {
      for (const element of document.body.children) {
        if (element === gate || ["SCRIPT", "STYLE", "SVG"].includes(element.tagName) || element.inert) continue;
        element.inert = true;
        lockedWorkspaceElements.add(element);
      }
    } else {
      for (const element of lockedWorkspaceElements) element.inert = false;
      lockedWorkspaceElements.clear();
    }
  }
  function stopLicenseWatch() {
    if (licenseWatchCleanup) licenseWatchCleanup();
    licenseWatchCleanup = null;
  }
  function startLicenseWatch(user, initialExpiry) {
    stopLicenseWatch();
    let stopped = false, expiryTimer = null;
    let knownExpiry = initialExpiry?.getTime() || 0;
    const snapshots = new Map(), unsubscribers = [];
    const emailId = String(user.email || "").trim().toLowerCase();
    const ids = [...new Set([emailId, user.uid].filter(Boolean))];
    const current = () => !stopped && auth?.currentUser?.uid === user.uid;
    const revoke = reason => {
      if (!current()) return;
      accessNotice = reason + " تبقى بياناتك المحلية محفوظة.";
      window.WaraqaAuthorized = false;
      closeAdminDashboard();
      setWorkspaceLocked(true);
      $("#wa-form").hidden = false;
      $("#wa-pin").value = "";
      showGate("تسجيل الدخول — الاشتراك غير متاح");
      setMessage(accessNotice, "error");
      stopLicenseWatch();
      // Keep the local database intact; end only the Firebase login session.
      Promise.resolve(firebase.signOut(auth)).catch(() => {});
    };
    const scheduleExpiry = () => {
      clearTimeout(expiryTimer);
      if (!current()) return;
      const remaining = knownExpiry - Date.now();
      if (remaining <= 0) { revoke("انتهت صلاحية اشتراكك."); return; }
      expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647));
    };
    const evaluate = () => {
      if (!current()) return;
      // An email license always takes precedence, including a stopped one.
      const canonical = snapshots.get(emailId);
      let selected = canonical?.exists() ? canonical : null;
      if (!selected) {
        if (ids.some(id => !snapshots.has(id))) return;
        selected = snapshots.get(user.uid);
      }
      if (!selected?.exists()) { revoke("لا يوجد اشتراك مفعّل لهذا الحساب."); return; }
      const data = selected.data(), expiry = expirationValue(data);
      if (data.active !== true) { revoke("تم إيقاف اشتراكك."); return; }
      if (!expiry || !Number.isFinite(expiry.getTime())) { revoke("تعذر التحقق من تاريخ انتهاء الاشتراك."); return; }
      knownExpiry = expiry.getTime();
      scheduleExpiry();
    };
    const resume = () => { if (current()) { scheduleExpiry(); evaluate(); } };
    const visibility = () => { if (document.visibilityState === "visible") resume(); };
    licenseWatchCleanup = () => {
      stopped = true;
      clearTimeout(expiryTimer);
      unsubscribers.forEach(unsubscribe => unsubscribe());
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", visibility);
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", visibility);
    scheduleExpiry();
    for (const id of ids) {
      if (!current()) break;
      unsubscribers.push(firebase.onSnapshot(firebase.doc(db, "licenses", id), snapshot => {
        if (!current()) return;
        snapshots.set(id, snapshot);
        evaluate();
      }, () => revoke("تعذر متابعة صلاحية الاشتراك. سجّل الدخول مجددًا للتحقق.")));
    }
  }
  window.WaraqaGetIdToken=async()=>{if(!window.WaraqaAuthorized||!auth?.currentUser||auth.currentUser.isAnonymous)throw Error("سجّل الدخول أولًا");return auth.currentUser.getIdToken();};
  async function authorize(user) {
    const version = ++authorizationVersion;
    stopLicenseWatch();
    gate.querySelector("#wa-windows-download")?.remove();
    gate.querySelector(".wa-card").hidden = false;
    if (!user) {
      window.WaraqaIsAdmin = false;
      setWorkspaceLocked(true);
      $("#wa-logout")?.remove();
      window.WaraqaAuthorized = false;
      $("#wa-form").hidden = false;
showGate();
      addAccountChip("", async () => {});
      setMessage(accessNotice || "أدخل بريدك ورمز الدخول.", accessNotice ? "error" : "");
      return;
    }
    if (user.isAnonymous) {
      setWorkspaceLocked(true);
      $("#wa-logout")?.remove();
      window.WaraqaAuthorized = false;
      $("#wa-form").hidden = false;
showGate("إرسال طلب الاشتراك");
      setMessage("");
      return;
    }
    const isAdmin = isAdminAccount(user);
    window.WaraqaIsAdmin = isAdmin;
    const license = isAdmin ? { valid: true } : await checkLicense(user);
    if (version !== authorizationVersion || auth?.currentUser?.uid !== user.uid) return;
    if (license.valid) {
      accessNotice = "";
      if (document.body.dataset.waraqaMode === "windows-download") {
        const card = gate.querySelector(".wa-card");
        const download = document.createElement("div");
        download.id = "wa-windows-download";
        download.className = "wa-card";
        download.setAttribute("role", "dialog");
        download.setAttribute("aria-modal", "true");
        download.setAttribute("aria-labelledby", "wa-download-title");
        download.innerHTML = `
          <h1 id="wa-download-title" tabindex="-1">تنزيل ورقة لويندوز</h1>
          <p class="wa-intro">تم التحقق من اشتراكك. النسخة التجريبية مخصصة لأجهزة ويندوز 64 بت.</p>
          <a class="wa-receipt-button" href="https://github.com/alatwi777/waraqa/actions/workflows/windows-pilot.yml?query=branch%3Awindows-pilot">تنزيل ورقة لويندوز</a>
          <p class="wa-intro">سجّل الدخول إلى GitHub، ثم اختر أحدث عملية بناء ناجحة وحمّل Waraqa-Windows-x64 من قسم Artifacts.</p>
          <button class="wa-button alt" type="button">تسجيل الخروج</button>
        `;
        card.hidden = true;
        gate.hidden = false;
        gate.append(download);
        download.querySelector("button").addEventListener("click", () => firebase.signOut(auth));
        download.querySelector("h1").focus();
        return;
      }
      setWorkspaceLocked(false);
      $("#wa-logout")?.remove();
      if (window.WaraqaLoadedUid && window.WaraqaLoadedUid !== user.uid) { location.reload(); return; }
      window.WaraqaFirebaseUid = user.uid;
      const sitePath = new URL(".", location.href).pathname;
      const ownerKey = "waraqa-pages-owner:" + sitePath;
      if (!localStorage.getItem(ownerKey)) localStorage.setItem(ownerKey, user.uid);
      window.WaraqaAuthorized = true;
      gate.hidden = true;
      setMessage("");
      addAccountChip(user.email || "حساب ورقة", async () => {
        closeAdminDashboard();
        await firebase.signOut(auth);
        window.WaraqaAuthorized = false;
        showGate();
      }, isAdmin);
      window.dispatchEvent(new Event("waraqa-authorized"));
      if (!isAdmin) startLicenseWatch(user, license.expiry);
      return;
    }
    window.WaraqaAuthorized = false;
    setWorkspaceLocked(true);
    $("#wa-form").hidden = false;
    addAccountChip(user.email || "حساب ورقة", async () => {
      closeAdminDashboard();
      await firebase.signOut(auth);
      window.WaraqaAuthorized = false;
    }, isAdmin);
    showGate("الاشتراك غير متاح");
    setMessage(license.reason + " تبقى بياناتك المحلية محفوظة.", "error");
    if (!$("#wa-logout")) {
      const button = document.createElement("button");
      button.id = "wa-logout"; button.type = "button"; button.className = "wa-button alt"; button.textContent = "تسجيل الخروج";
      $("#wa-form").after(button);
    }
    $("#wa-logout").onclick = () => firebase.signOut(auth);
  }

  try {
    const [appSdk, authModule, storeSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")
    ]);
    authSdk = authModule;
    firebase = { ...appSdk, ...authSdk, ...storeSdk };
    const app = appSdk.initializeApp(firebaseConfig);
    auth = authSdk.getAuth(app);
    db = storeSdk.getFirestore(app);
    $("#wa-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = $("#wa-email").value.trim().toLowerCase();
      const pin = normalizePin($("#wa-pin").value);
      if (!$("#wa-form").reportValidity()) return;
      setBusy(true); setMessage("جارٍ تسجيل الدخول…");
      try { await authSdk.signInWithEmailAndPassword(auth, email, pin); $("#wa-pin").value = ""; }
      catch (error) { setMessage(authErrorText(error, "login"), "error"); }
      finally { setBusy(false); }
    });
    authSdk.onAuthStateChanged(auth, authorize);
  } catch (error) {
    showGate("تعذر تشغيل تسجيل الدخول");
    setMessage("تعذر تحميل خدمة تسجيل الدخول. تأكد من اتصال الإنترنت وأن النطاق مسموح في Firebase.", "error");
  }
})();
