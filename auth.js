import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Thêm các hàm để truy vấn Database
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const alertBox = document.getElementById("alertBox");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Chức năng Hiện/Ẩn mật khẩu
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const icon = this.querySelector("i");
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    } else {
      passwordInput.type = "password";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    }
  });

// Xử lý Đăng nhập
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Lấy giá trị người dùng nhập (xóa khoảng trắng 2 đầu)
  const inputValue = emailInput.value.trim();
  const password = passwordInput.value;

  // Hiển thị nút "Đang xử lý"
  loginBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';
  loginBtn.disabled = true;

  try {
    let loginEmail = inputValue;

    // 1. Dò tìm Email nếu nhập bằng Username
    if (!inputValue.includes("@")) {
      const usersRef = ref(db, "users");
      const q = query(usersRef, orderByChild("username"), equalTo(inputValue));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        loginEmail = userData[userId].email;
      } else {
        throw new Error("user-not-found");
      }
    }

    // 2. Đăng nhập vào Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginEmail,
      password,
    );
    const user = userCredential.user;

    // 3. KIỂM TRA QUYỀN TÀI KHOẢN ĐỂ CHUYỂN TRANG
    const userRef = ref(db, "users/" + user.uid);
    const userSnapshot = await get(userRef);

    let redirectUrl = "trang-chu.html"; // Mặc định là khách sẽ vào trang chủ

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      // Nếu tài khoản có cấp quyền role là admin -> Đổi link sang trang admin
      if (userData.role === "admin") {
        redirectUrl = "admin.html";
      }
    }

    // --- ĐĂNG NHẬP THÀNH CÔNG ---
    alertBox.className = "alert alert-success";
    alertBox.innerHTML = "Đăng nhập thành công! Đang vào hệ thống...";
    alertBox.classList.remove("d-none");

    // Chuyển hướng sang trang tương ứng (Admin hoặc Trang chủ) sau 1.5 giây
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  } catch (error) {
    // --- ĐĂNG NHẬP THẤT BẠI ---
    loginBtn.innerHTML =
      'Đăng Nhập <i class="fa-solid fa-arrow-right ms-2 small"></i>';
    loginBtn.disabled = false;
    alertBox.className = "alert alert-danger";
    alertBox.classList.remove("d-none");

    // Thông báo lỗi chuẩn
    if (
      error.message === "user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      alertBox.innerHTML = "Tên đăng nhập, email hoặc mật khẩu không đúng!";
    } else if (error.code === "auth/too-many-requests") {
      alertBox.innerHTML = "Nhập sai quá nhiều lần. Tài khoản bị tạm khóa!";
    } else {
      alertBox.innerHTML = "Lỗi: " + error.message;
    }
  }
});
