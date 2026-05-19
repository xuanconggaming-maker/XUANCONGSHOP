import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Thông tin API chuẩn dự án xuancongmxh
const firebaseConfig = {
  apiKey: "AIzaSyCMKM_e3j3z-q3fV7IFYRCtuoCBURwSKXE",
  authDomain: "xuancongmxh.firebaseapp.com",
  databaseURL:
    "https://xuancongmxh-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xuancongmxh",
  storageBucket: "xuancongmxh.firebasestorage.app",
  messagingSenderId: "417606278037",
  appId: "1:417606278037:web:7c4af2096fe8a0af92749c",
  measurementId: "G-YC876C90Y3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const alertBox = document.getElementById("alertBox");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Hiện/Ẩn mật khẩu
const togglePassword = document.getElementById("togglePassword");
if (togglePassword) {
  togglePassword.addEventListener("click", function () {
    const icon = this.querySelector("i");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    } else {
      passwordInput.type = "password";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    }
  });
}

// =================================================================
// 0. XỬ LÝ NÚT QUÊN MẬT KHẨU TRONG MODAL
// =================================================================
const btnSendReset = document.getElementById("btnSendReset");
if (btnSendReset) {
  btnSendReset.addEventListener("click", async () => {
    const resetEmail = document.getElementById("resetEmailInput").value.trim();
    const resetAlert = document.getElementById("resetAlert");

    if (!resetEmail || !resetEmail.includes("@")) {
      resetAlert.className = "alert alert-warning small py-2";
      resetAlert.innerHTML = "⚠️ Vui lòng nhập đúng định dạng Email!";
      resetAlert.classList.remove("d-none");
      return;
    }

    try {
      btnSendReset.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';
      btnSendReset.disabled = true;

      await sendPasswordResetEmail(auth, resetEmail);

      resetAlert.className = "alert alert-success small py-2";
      resetAlert.innerHTML =
        "✅ Đã gửi link khôi phục! Vui lòng kiểm tra hộp thư (cả mục Spam/Thư rác).";
      resetAlert.classList.remove("d-none");
    } catch (error) {
      resetAlert.className = "alert alert-danger small py-2";
      resetAlert.classList.remove("d-none");
      if (error.code === "auth/user-not-found") {
        resetAlert.innerHTML = "❌ Email này chưa đăng ký tài khoản!";
      } else {
        resetAlert.innerHTML = "❌ Lỗi: " + error.message;
      }
    } finally {
      btnSendReset.innerHTML = "Gửi Email Khôi Phục";
      btnSendReset.disabled = false;
    }
  });
}

// =================================================================
// 1. ĐĂNG NHẬP THỦ CÔNG (EMAIL / USERNAME)
// =================================================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const inputValue = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  loginBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';
  loginBtn.disabled = true;
  alertBox.classList.add("d-none");

  try {
    let loginEmail = inputValue;

    if (!inputValue.includes("@")) {
      const usersRef = ref(db, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        let foundEmail = null;

        for (let uid in usersData) {
          if (
            usersData[uid].username &&
            usersData[uid].username.toLowerCase().trim() === inputValue
          ) {
            foundEmail = usersData[uid].email;
            break;
          }
        }
        if (foundEmail) loginEmail = foundEmail;
        else throw new Error("user-not-found");
      } else {
        throw new Error("user-not-found");
      }
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail,
      password,
    );
    const user = userCredential.user;

    const userSnapshot = await get(ref(db, "users/" + user.uid));
    let redirectUrl = "trang-chu.html";
    if (userSnapshot.exists() && userSnapshot.val().role === "admin") {
      redirectUrl = "admin.html";
    }

    alertBox.className = "alert alert-success text-center fw-bold";
    alertBox.innerHTML = "🎉 Đăng nhập thành công! Đang chuyển hướng...";
    alertBox.classList.remove("d-none");
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1200);
  } catch (error) {
    loginBtn.innerHTML =
      'Đăng Nhập <i class="fa-solid fa-arrow-right ms-2 small"></i>';
    loginBtn.disabled = false;
    alertBox.className = "alert alert-danger text-center fw-bold";
    alertBox.classList.remove("d-none");
    if (
      error.message === "user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      alertBox.innerHTML = "❌ Tên đăng nhập hoặc mật khẩu chưa đúng!";
    } else {
      alertBox.innerHTML = "❌ Lỗi: " + error.message;
    }
  }
});

// =================================================================
// 2. ĐĂNG NHẬP BẰNG GOOGLE
// =================================================================
const googleImg = document.querySelector("button img[alt='Google']");
if (googleImg) {
  const googleBtn = googleImg.closest("button");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      alertBox.classList.add("d-none");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userRef = ref(db, "users/" + user.uid);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
          const autoUsername =
            user.email.split("@")[0] + Math.floor(100 + Math.random() * 900);
          await set(userRef, {
            uid: user.uid,
            fullName: user.displayName || "Khách Google",
            username: autoUsername,
            email: user.email,
            balance: 0,
            totalDeposit: 0,
            role: "member",
          });
        }

        const checkSnapshot = await get(userRef);
        let redirectUrl = "trang-chu.html";
        if (checkSnapshot.exists() && checkSnapshot.val().role === "admin") {
          redirectUrl = "admin.html";
        }

        alertBox.className = "alert alert-success text-center fw-bold";
        alertBox.innerHTML = "🎉 Đăng nhập thành công! Đang tiến vào shop...";
        alertBox.classList.remove("d-none");
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1200);
      } catch (error) {
        alertBox.className = "alert alert-danger text-center fw-bold";
        alertBox.classList.remove("d-none");
        if (error.code === "auth/popup-closed-by-user") {
          alertBox.innerHTML = "⚠️ Bạn đã đóng cửa sổ đăng nhập.";
        } else if (error.code === "auth/unauthorized-domain") {
          alertBox.innerHTML =
            "❌ Miền này chưa được ủy quyền trong Firebase Console!";
        } else {
          alertBox.innerHTML = "❌ Lỗi: " + error.message;
        }
      }
    });
  }
}

// Báo bảo trì nút Apple
const appleIcon = document.querySelector("button i.fa-apple");
if (appleIcon) {
  const appleBtn = appleIcon.closest("button");
  if (appleBtn) {
    appleBtn.addEventListener("click", () => {
      alert(
        "🍎 Tính năng đăng nhập bằng Apple ID đang bảo trì. Vui lòng sử dụng Google!",
      );
    });
  }
}
