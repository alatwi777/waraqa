'use strict';
window.WaraqaAuthGate = true;
window.WaraqaAuthorized = false;

(async () => {
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
      .wa-card{width:min(440px,100%);padding:30px;background:#fff;border:1px solid #dce8df;border-radius:24px;box-shadow:0 28px 90px #0004}
      .wa-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}.wa-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#0a7058;color:#fff;font-size:24px}.wa-brand b{font-size:23px}.wa-brand small{display:block;color:#74847d;font-size:13px}
      .wa-card h1{margin:0 0 8px;font-size:22px}.wa-intro{margin:0 0 20px;color:#687a72;line-height:1.8}
      .wa-field{display:block;margin:13px 0;color:#304b42;font-weight:700;font-size:14px}.wa-field input{display:block;width:100%;margin-top:6px;padding:12px 13px;border:1px solid #cbd9d1;border-radius:11px;background:#fbfdfc;color:#182f28;font:inherit;direction:ltr;text-align:left}.wa-password-wrap{position:relative;margin-top:6px}.wa-password-wrap input{margin-top:0;padding-right:82px}.wa-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;border-radius:7px;padding:7px 9px;background:transparent;color:#116a55;font:700 13px system-ui,sans-serif;cursor:pointer}
      .wa-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.wa-button{border:0;border-radius:11px;padding:12px 16px;background:#0a7058;color:#fff;font:700 14px system-ui,sans-serif;cursor:pointer}.wa-button.alt{border:1px solid #d0ded6;background:#fff;color:#245548}.wa-button:disabled{opacity:.6;cursor:wait}
      .wa-message{min-height:26px;margin:14px 0 0;color:#526a60;line-height:1.7}.wa-message.error{color:#a42e2e}.wa-message.ok{color:#08734d}
      .wa-switch{border:0;background:none;color:#116a55;text-decoration:underline;cursor:pointer;font:inherit;padding:0}.wa-small{margin-top:12px;font-size:13px;color:#6c7d75}.wa-local{margin-top:18px;padding:12px 14px;border-radius:12px;background:#f2f6f3;color:#53665c;font-size:13px;line-height:1.8}
      .waraqa-account-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d7e3dc;border-radius:999px;background:#f8fbf9;color:#174b3e;font-size:12px;max-width:250px}.waraqa-account-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.waraqa-account-chip button{border:0;background:none;color:#9a3b32;font:inherit;cursor:pointer}
      @media(max-width:540px){.wa-card{padding:23px 20px}.waraqa-account-chip{max-width:150px}}
    </style>
    <div class="wa-card" role="dialog" aria-modal="true" aria-labelledby="wa-title">
      <div class="wa-brand"><span class="wa-mark" aria-hidden="true">و</span><div><b>ورقة</b><small>مساحة المعلم</small></div></div>
      <h1 id="wa-title">تسجيل الدخول</h1>
      <p class="wa-intro">سجّل الدخول بحساب ورقة للتحقق من صلاحية الاشتراك. بيانات الطلاب والاختبارات تبقى محفوظة على هذا الجهاز.</p>
      <form id="wa-form">
        <label class="wa-field">البريد الإلكتروني<input id="wa-email" type="email" autocomplete="username" required></label>
        <div class="wa-field"><label for="wa-password">كلمة المرور</label><div class="wa-password-wrap"><input id="wa-password" type="password" autocomplete="current-password" minlength="6" required><button class="wa-password-toggle" id="wa-password-toggle" type="button" aria-controls="wa-password" aria-pressed="false" aria-label="إظهار كلمة المرور">إظهار</button></div></div>
        <div class="wa-actions"><button class="wa-button" id="wa-submit" type="submit">دخول</button><button class="wa-button alt" id="wa-create" type="button">إنشاء حساب</button></div>
      </form>
      <p class="wa-message" id="wa-message" role="status"></p>
      <p class="wa-small"><button class="wa-switch" id="wa-reset" type="button">نسيت كلمة المرور؟ أرسل رابط إعادة التعيين</button></p>
      <div class="wa-local">الحساب يتحقق من الاشتراك فقط. لا تُرفع بيانات الطلاب أو صور الاختبارات إلى Firebase.</div>
    </div>`;
  document.body.appendChild(gate);
  const $ = (selector) => gate.querySelector(selector);
  const message = $("#wa-message");
  const passwordInput = $("#wa-password");
  const passwordToggle = $("#wa-password-toggle");
  passwordToggle.addEventListener("click", () => {
    const reveal = passwordInput.type === "password";
    passwordInput.type = reveal ? "text" : "password";
    passwordToggle.textContent = reveal ? "إخفاء" : "إظهار";
    passwordToggle.setAttribute("aria-pressed", String(reveal));
    passwordToggle.setAttribute("aria-label", reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
  });
  let auth, db, firebase;

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
  function addAccountChip(email, logout) {
    const target = document.querySelector(".header-left");
    if (!target) return;
    let chip = document.getElementById("waraqa-account-chip");
    if (!email) { chip?.remove(); return; }
    if (!chip) { chip = document.createElement("div"); chip.id = "waraqa-account-chip"; chip.className = "waraqa-account-chip"; target.prepend(chip); }
    chip.replaceChildren();
    const label = document.createElement("span"); label.title = email; label.textContent = email;
    const button = document.createElement("button"); button.type = "button"; button.textContent = "خروج";
    button.addEventListener("click", logout); chip.append(label, button);
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
      const snap = await firebase.getDoc(firebase.doc(db, "licenses", user.uid));
      if (!snap.exists()) return { valid: false, reason: "لا يوجد اشتراك مفعّل لهذا الحساب." };
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
      showGate();
      addAccountChip("", async () => {});
      setMessage("أدخل بيانات حسابك للمتابعة.");
      return;
    }
    const license = await checkLicense(user);
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
        await firebase.signOut(auth);
        window.WaraqaAuthorized = false;
        showGate();
      });
      window.dispatchEvent(new Event("waraqa-authorized"));
      return;
    }
    window.WaraqaAuthorized = false;
    $("#wa-form").hidden = true;
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
    const [appSdk, authSdk, storeSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")
    ]);
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
