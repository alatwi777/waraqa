'use strict';
window.WaraqaAuthGate = true;
window.WaraqaAuthorized = false;

(async () => {
  const ADMIN_EMAIL = "aaddaa5400@gmail.com";
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
      #waraqa-auth-gate[hidden]{display:none}
      #waraqa-auth-gate *{box-sizing:border-box}
      .wa-card{width:min(1080px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:32px;background:#fff;border:1px solid #dce8df;border-radius:28px;box-shadow:0 28px 90px #0004}.wa-page-heading{text-align:center;margin:0 auto 24px;max-width:720px}.wa-page-heading h1{margin:0 0 8px;font-size:clamp(26px,3vw,36px);color:#153e32}.wa-page-heading p{margin:0;color:#718179;line-height:1.8}.wa-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}.wa-section{padding:24px;border:1px solid #e0eae4;border-radius:22px;background:#fff;box-shadow:0 12px 32px #173b2d0a}.wa-section h2{margin:0 0 6px;font-size:22px;color:#173d32}.wa-section-intro{margin:0 0 16px;color:#718179;line-height:1.7;font-size:14px}.wa-brand{margin-bottom:12px}.wa-section .wa-brand{margin-bottom:16px}.wa-price-card{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#f5efe1,#fff9ec);border:1px solid #ead9b5}.wa-price-card small{display:block;color:#697a71}.wa-price-value{font-size:28px;font-weight:900;color:#a36a16;white-space:nowrap}.wa-price-value small{display:inline;color:#8a6b39;font-size:13px;font-weight:700}.wa-transfer{margin-top:16px;padding:16px;border:1px dashed #b6c8bd;border-radius:16px;background:#f7faf8}.wa-transfer-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-weight:900;color:#244b3e}.wa-setup-badge{padding:4px 9px;border-radius:999px;background:#fff0ce;color:#835b13;font-size:11px;white-space:nowrap}.wa-transfer p{margin:7px 0;color:#687b72;font-size:13px;line-height:1.8}.wa-plan-submit{width:100%;margin-top:15px;padding:13px 16px;border:0;border-radius:12px;background:linear-gradient(135deg,#0a7058,#14866b);color:#fff;font:800 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 18px #0a70582b}.wa-plan-submit:hover{filter:brightness(1.05);transform:translateY(-1px)}.wa-plan-note{margin:10px 0 0;color:#718179;font-size:12px;text-align:center;line-height:1.7}.wa-plan-select{display:block;width:100%;margin-top:6px;padding:12px;border:1px solid #cbd9d1;border-radius:11px;background:#fbfdfc;color:#182f28;font:inherit}.wa-transfer .wa-field{margin-bottom:0}.wa-login-section{background:linear-gradient(150deg,#fff,#f8fbf9)}.wa-login-section .wa-brand{margin-bottom:14px}.wa-login-section .wa-field{margin:14px 0}.wa-login-section .wa-actions .wa-button{flex:1}.wa-section .wa-message{min-height:26px}@media(max-width:760px){#waraqa-auth-gate{padding:12px}.wa-card{padding:22px 18px;max-height:calc(100vh - 24px);border-radius:22px}.wa-columns{grid-template-columns:1fr;gap:12px}.wa-section{padding:19px}.wa-page-heading{margin-bottom:18px}.wa-section h2{font-size:20px}}
      .wa-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.wa-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#0a7058;color:#fff;font-size:24px}.wa-brand b{font-size:23px}.wa-brand small{display:block;color:#74847d;font-size:13px}
      .wa-card h1{margin:0 0 8px;font-size:22px}.wa-intro{margin:0 0 20px;color:#687a72;line-height:1.8}
      .wa-field{display:block;margin:13px 0;color:#304b42;font-weight:700;font-size:14px}.wa-field input{display:block;width:100%;margin-top:6px;padding:12px 13px;border:1px solid #cbd9d1;border-radius:11px;background:#fbfdfc;color:#182f28;font:inherit;direction:ltr;text-align:left}.wa-password-wrap{position:relative;margin-top:6px}.wa-password-wrap input{margin-top:0;padding-right:82px}.wa-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;border-radius:7px;padding:7px 9px;background:transparent;color:#116a55;font:700 13px system-ui,sans-serif;cursor:pointer}
      .wa-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.wa-button{border:0;border-radius:11px;padding:12px 16px;background:#0a7058;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}.wa-button.alt{border:1px solid #d0ded6;background:#fff;color:#245548}.wa-button:disabled{opacity:.6;cursor:wait}
      .wa-message{min-height:26px;margin:14px 0 0;color:#526a60;line-height:1.7}.wa-message.error{color:#a42e2e}.wa-message.ok{color:#08734d}
      .wa-switch{border:0;background:none;color:#116a55;text-decoration:underline;cursor:pointer;font:inherit;padding:0}.wa-small{margin-top:12px;font-size:13px;color:#6c7d75}.wa-local{margin-top:18px;padding:12px 14px;border-radius:12px;background:#f2f6f3;color:#53665c;font-size:13px;line-height:1.8}
      .waraqa-account-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d7e3dc;border-radius:999px;background:#f8fbf9;color:#174b3e;font-size:12px;max-width:none;white-space:nowrap;flex-shrink:0}.waraqa-account-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}.waraqa-account-chip button{border:0;background:none;color:#9a3b32;font:inherit;cursor:pointer}.waraqa-account-chip button{border:0;background:none;color:#9a3b32;font:inherit;cursor:pointer;padding:4px 6px}.waraqa-account-chip .wa-admin-open{padding:7px 10px;border-radius:9px;background:#0a7058;color:#fff;font-weight:800}.wa-admin-overlay{position:fixed;inset:0;z-index:2147483001;display:none;place-items:center;padding:18px;background:#10211dcc;direction:rtl;color:#17372d}.wa-admin-overlay.open{display:grid}.wa-admin-panel{width:min(1000px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:22px;background:#f8fbf9;box-shadow:0 24px 80px #0006}.wa-admin-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.wa-admin-head h2{margin:0;font-size:23px}.wa-admin-head p{margin:5px 0 0;color:#60756b}.wa-admin-close{border:0;border-radius:50%;width:38px;height:38px;background:#e5ece8;color:#24473b;font-size:22px;cursor:pointer}.wa-admin-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}.wa-admin-stat{padding:14px;border-radius:14px;background:#e8f3ee}.wa-admin-stat b{display:block;color:#0a7058;font-size:25px}.wa-admin-form{display:grid;grid-template-columns:minmax(180px,1fr) 150px auto;gap:10px;align-items:end;padding:15px;border:1px solid #dbe8e0;border-radius:16px;background:white}.wa-admin-form label{display:block;font-size:13px;font-weight:800;color:#40594e}.wa-admin-form input{display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #cbd9d1;border-radius:9px;font:inherit}.wa-admin-form button{padding:11px 15px;border:0;border-radius:10px;background:#0a7058;color:white;font-weight:800;cursor:pointer}.wa-admin-message{min-height:26px;margin:10px 2px;color:#08734d}.wa-admin-message.error{color:#a42e2e}.wa-admin-table-wrap{overflow:auto;border:1px solid #dbe8e0;border-radius:14px;background:white}.wa-admin-table{width:100%;border-collapse:collapse;min-width:650px}.wa-admin-table th,.wa-admin-table td{padding:11px;text-align:right;border-bottom:1px solid #e4ece7}.wa-admin-table th{background:#edf4f0;color:#345448}.wa-admin-action{border:0;border-radius:8px;padding:7px 10px;background:#b33b36;color:#fff;font-weight:700;cursor:pointer}.wa-admin-action:disabled,.wa-admin-form button:disabled{opacity:.6;cursor:wait}@media(max-width:640px){.wa-admin-panel{padding:16px}.wa-admin-stats{grid-template-columns:1fr}.wa-admin-form{grid-template-columns:1fr}.wa-admin-head h2{font-size:19px}}
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
          <p class="wa-section-intro">أدخل بيانات حسابك للتحقق من صلاحية الاشتراك والمتابعة إلى ورقة.</p>
          <form id="wa-form">
            <label class="wa-field">البريد الإلكتروني<input id="wa-email" type="email" autocomplete="username" required></label>
            <div class="wa-field"><label for="wa-password">كلمة المرور</label><div class="wa-password-wrap"><input id="wa-password" type="password" autocomplete="current-password" minlength="6" required><button class="wa-password-toggle" id="wa-password-toggle" type="button" aria-controls="wa-password" aria-pressed="false" aria-label="إظهار كلمة المرور">إظهار</button></div></div>
            <div class="wa-actions"><button class="wa-button" id="wa-submit" type="submit">دخول</button><button class="wa-button alt" id="wa-create" type="button">إنشاء حساب</button></div>
          </form>
          <p class="wa-message" id="wa-message" role="status"></p>
          <p class="wa-small"><button class="wa-switch" id="wa-reset" type="button">نسيت كلمة المرور؟ أرسل رابط إعادة التعيين</button></p>

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
          showFeedback("الطلب تحت الإجراء. سيتم التفعيل مباشرة بعد التحقق من وصول الحوالة.");
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
        showFeedback("الطلب تحت الإجراء. سيتم التفعيل مباشرة بعد التحقق من وصول الحوالة.");
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
    const passwordInput = $("#wa-password");
  const passwordToggle = $("#wa-password-toggle");
  passwordToggle.addEventListener("click", () => {
    const reveal = passwordInput.type === "password";
    passwordInput.type = reveal ? "text" : "password";
    passwordToggle.textContent = reveal ? "إخفاء" : "إظهار";
    passwordToggle.setAttribute("aria-pressed", String(reveal));
    passwordToggle.setAttribute("aria-label", reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
  });
  let auth, db, firebase, authSdk;
  let adminRequestsUnsubscribe = null;

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
    if (action === "login" && code === "auth/invalid-credential") return "البريد أو كلمة المرور غير صحيحة. استخدم رابط إعادة التعيين إذا نسيت كلمة المرور.";
    return messages[code] || `تعذر ${action === "reset" ? "إرسال رابط إعادة التعيين" : "تسجيل الدخول"} (رمز Firebase: ${code}).`;
  }
  function setBusy(value) { $("#wa-submit").disabled = value; $("#wa-create").disabled = value; }
  function showGate(title = "تسجيل الدخول") { gate.hidden = false; $("#wa-title").textContent = title; }
  function openAccountPanel() {
    if (auth?.currentUser) {
      $("#wa-form").hidden = true;
      $("#wa-reset").closest(".wa-small").hidden = true;
      $("#wa-plan-email").value = auth.currentUser.email || "";
      $("#wa-plan-message").textContent = "أنت مسجل الدخول. أكمل بيانات الطلب أو سجّل خروجك لتبديل الحساب.";
      $("#wa-plan-message").style.color = "#526a60";
      showGate("الاشتراك والحساب");
    } else {
      $("#wa-form").hidden = false;
      $("#wa-reset").closest(".wa-small").hidden = false;
      showGate("تسجيل الدخول والاشتراك");
    }
  }
  function addAccountChip(email, logout, isAdmin = false) {
    const target = document.querySelector(".header-left");
    if (!target) return;
    let chip = document.getElementById("waraqa-account-chip");
    if (!chip) {
      chip = document.createElement("div");
      chip.id = "waraqa-account-chip";
      chip.className = "waraqa-account-chip";
      target.prepend(chip);
    }
    chip.replaceChildren();
    if (email) {
      const label = document.createElement("span");
      label.title = email;
      label.textContent = email;
      chip.append(label);
    }
    const accountButton = document.createElement("button");
    accountButton.type = "button";
    accountButton.className = "wa-admin-open";
    accountButton.textContent = email ? "الاشتراك" : "دخول / اشتراك";
    accountButton.addEventListener("click", openAccountPanel);
    chip.append(accountButton);
    if (email && isAdmin) {
      const adminButton = document.createElement("button");
      adminButton.type = "button";
      adminButton.className = "wa-admin-open";
      adminButton.textContent = "لوحة التحكم";
      adminButton.addEventListener("click", openAdminDashboard);
      chip.append(adminButton);
    }
    if (email) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "تسجيل الخروج";
      button.addEventListener("click", logout);
      chip.append(button);
    }
  }
  function adminStatus(text, error = false) {
    const node = document.getElementById("wa-admin-message");
    if (!node) return;
    node.textContent = text;
    node.className = "wa-admin-message" + (error ? " error" : "");
  }
  function closeAdminDashboard() {
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
      overlay.innerHTML = '<div class="wa-admin-panel" role="dialog" aria-modal="true" aria-labelledby="wa-admin-title"><div class="wa-admin-head"><div><h2 id="wa-admin-title">لوحة إدارة اشتراكات ورقة</h2><p>أضف البريد ومدة الاشتراك، وستُحفظ الصلاحية في Firebase.</p></div><button type="button" class="wa-admin-close" aria-label="إغلاق">×</button></div><div class="wa-admin-stats"><div class="wa-admin-stat">المشتركون النشطون<b id="wa-admin-active">—</b></div><div class="wa-admin-stat">منتهية أو موقوفة<b id="wa-admin-expired">—</b></div><div class="wa-admin-stat">إجمالي السجلات<b id="wa-admin-total">—</b></div></div><form class="wa-admin-form" id="wa-admin-form"><label>بريد العميل<input id="wa-admin-email" type="email" autocomplete="off" required placeholder="name@example.com"></label><label>مدة الاشتراك بالأيام<input id="wa-admin-days" type="number" min="1" max="3650" step="1" value="30" required></label><button type="submit">إضافة / تجديد</button></form><p id="wa-admin-message" class="wa-admin-message" role="status"></p><div class="wa-admin-table-wrap"><table class="wa-admin-table"><thead><tr><th>البريد / المعرّف</th><th>الخطة</th><th>تاريخ الانتهاء</th><th>المدة المتبقية</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="wa-admin-rows"></tbody></table></div><h3>طلبات الاشتراك الجديدة</h3><div class="wa-admin-table-wrap"><table class="wa-admin-table"><thead><tr><th>العميل</th><th>البريد</th><th>الجوال</th><th>المدة والمبلغ</th><th>مرجع التحويل</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="wa-admin-request-rows"></tbody></table></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector(".wa-admin-close").addEventListener("click", closeAdminDashboard);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) closeAdminDashboard(); });
      overlay.querySelector("#wa-admin-form").addEventListener("submit", saveAdminLicense);
    }
    overlay.classList.add("open");
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
      records.sort((a,b) => (asDate(a.data.expiresAt)?.getTime() || 0) - (asDate(b.data.expiresAt)?.getTime() || 0));
      records.forEach(record => {
        const row = document.createElement("tr");
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
          actionCell.textContent = "—";
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
    body.replaceChildren();
    adminStatus("جارٍ تحميل الطلبات…");
    try {
      adminRequestsUnsubscribe = firebase.onSnapshot(
        firebase.collection(db, "subscriptionRequests"),
        (snapshot) => {
          const requests = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
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
              const activate = document.createElement("button");
              activate.type = "button"; activate.className = "wa-admin-form-button"; activate.textContent = "تفعيل بعد التحقق";
              activate.addEventListener("click", () => activateSubscriptionRequest(request.id));
              action.appendChild(activate);
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
  async function activateSubscriptionRequest(uid) {
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    if (!window.confirm("هل تحققت من وصول المبلغ؟ سيتم تفعيل الاشتراك الآن.")) return;
    adminStatus("جارٍ تفعيل الاشتراك…");
    try {
      const requestRef = firebase.doc(db, "subscriptionRequests", uid);
      const requestSnap = await firebase.getDoc(requestRef);
      if (!requestSnap.exists() || requestSnap.data().status !== "pending") {
        adminStatus("الطلب غير موجود أو تمت معالجته مسبقًا.", true);
        await loadAdminRequests();
        return;
      }
      const request = requestSnap.data();
      const email = String(request.email || "").trim().toLowerCase();
      const months = Number(request.months);
      if (!email || !Number.isInteger(months) || ![1].includes(months)) throw new Error("invalid-request");
      const licenseRef = firebase.doc(db, "licenses", email);
      const licenseSnap = await firebase.getDoc(licenseRef);
      const previous = licenseSnap.exists() ? licenseSnap.data() : null;
      const now = new Date();
      const priorExpiry = asDate(previous?.expiresAt);
      const start = previous?.active === true && priorExpiry && priorExpiry > now ? priorExpiry : now;
      const expiresAt = new Date(start.getTime() + months * 30 * 86400000);
      const batch = firebase.writeBatch(db);
      batch.set(licenseRef, {
        email,
        active: true,
        plan: months + (months === 1 ? " شهر" : " أشهر"),
        createdAt: previous?.createdAt || firebase.Timestamp.now(),
        expiresAt: firebase.Timestamp.fromDate(expiresAt)
      }, { merge: true });
      batch.update(requestRef, {
        status: "activated",
        reviewedAt: firebase.serverTimestamp(),
        activatedUntil: firebase.Timestamp.fromDate(expiresAt)
      });
      await batch.commit();
      adminStatus("تم تفعيل " + email + " حتى " + expiresAt.toLocaleDateString("ar-SA") + ".");
      await Promise.all([loadAdminLicenses(), loadAdminRequests()]);
    } catch (error) {
      adminStatus("تعذر التفعيل. تأكد من نشر القواعد الجديدة، ثم راجع صحة الطلب.", true);
    }
  }
  async function saveAdminLicense(event) {
    event.preventDefault();
    if (!auth?.currentUser || !isAdminAccount(auth.currentUser)) return;
    const email = document.getElementById("wa-admin-email").value.trim().toLowerCase();
    const days = Number(document.getElementById("wa-admin-days").value);
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    if (!email || !Number.isInteger(days) || days < 1 || days > 3650) {
      adminStatus("أدخل بريدًا صحيحًا ومدة بين يوم و١٠ سنوات.", true);
      return;
    }
    submit.disabled = true;
    adminStatus("جارٍ حفظ الاشتراك في Firebase…");
    try {
      const ref = firebase.doc(db, "licenses", email);
      let previous = null;
      try { const existing = await firebase.getDoc(ref); if (existing.exists()) previous = existing.data(); } catch {}
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
      adminStatus("تم تفعيل / تجديد " + email + " حتى " + expiresAt.toLocaleDateString("ar-SA") + ".");
      await loadAdminLicenses();
    } catch (error) {
      adminStatus("تعذر الحفظ في Firebase. انشر قواعد Firestore المحدّثة ثم أعد المحاولة.", true);
    } finally {
      submit.disabled = false;
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
  async function authorize(user) {
    if (!user) {
      $("#wa-logout")?.remove();
      window.WaraqaAuthorized = false;
      $("#wa-form").hidden = false;
      $("#wa-reset").closest(".wa-small").hidden = false;
      showGate();
      addAccountChip("", async () => {});
      setMessage("أدخل بيانات حسابك أو أنشئ حسابًا جديدًا للمتابعة.");
      return;
    }
    if (user.isAnonymous) {
      $("#wa-logout")?.remove();
      window.WaraqaAuthorized = false;
      $("#wa-form").hidden = false;
      $("#wa-reset").closest(".wa-small").hidden = false;
      showGate("إرسال طلب الاشتراك");
      setMessage("");
      return;
    }
    const isAdmin = isAdminAccount(user);
    const license = isAdmin ? { valid: true } : await checkLicense(user);
    if (license.valid) {
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
      return;
    }
    window.WaraqaAuthorized = false;
    $("#wa-form").hidden = true;
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
      event.preventDefault(); setBusy(true); setMessage("جارٍ تسجيل الدخول…");
      try { await authSdk.signInWithEmailAndPassword(auth, $("#wa-email").value.trim(), $("#wa-password").value); }
      catch (error) { setMessage(authErrorText(error, "login"), "error"); }
      finally { setBusy(false); }
    });
    $("#wa-create").addEventListener("click", async () => {
      const email = $("#wa-email").value.trim(), password = $("#wa-password").value;
      if (!email || password.length < 6) { setMessage("أدخل بريدًا إلكترونيًا وكلمة مرور من ٦ أحرف على الأقل.", "error"); return; }
      setBusy(true); setMessage("جارٍ إنشاء الحساب…");
      try { await authSdk.createUserWithEmailAndPassword(auth, email, password); }
      catch (error) { setMessage(error?.code === "auth/email-already-in-use" ? "هذا البريد مسجل مسبقًا؛ استخدم زر الدخول." : "تعذر إنشاء الحساب. تحقق من البريد وكلمة المرور.", "error"); }
      finally { setBusy(false); }
    });
    $("#wa-reset").addEventListener("click", async () => {
      const email = $("#wa-email").value.trim();
      if (!email) { setMessage("اكتب البريد الإلكتروني أولًا.", "error"); return; }
      try { await authSdk.sendPasswordResetEmail(auth, email); setMessage("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.", "ok"); }
      catch (error) { setMessage(authErrorText(error, "reset"), "error"); }
    });
    authSdk.onAuthStateChanged(auth, authorize);
  } catch (error) {
    showGate("تعذر تشغيل تسجيل الدخول");
    setMessage("تعذر تحميل خدمة تسجيل الدخول. تأكد من اتصال الإنترنت وأن النطاق مسموح في Firebase.", "error");
  }
})();
