import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Khai báo thêm thư viện Realtime Database
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // Khởi tạo Database

const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const alertBox = document.getElementById("registerAlertBox");

// Hiện/Ẩn mật khẩu
document
  .querySelector(".toggle-password")
  .addEventListener("click", function () {
    const pwdInput = document.getElementById("password");
    const icon = this.querySelector("i");
    if (pwdInput.type === "password") {
      pwdInput.type = "text";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    } else {
      pwdInput.type = "password";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    }
  });

// Xử lý sự kiện Đăng ký
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const username = document.getElementById("username").value; // Lấy tên đăng nhập
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Kiểm tra mật khẩu khớp nhau
  if (password !== confirmPassword) {
    alertBox.className = "alert alert-danger";
    alertBox.innerHTML = "Mật khẩu xác nhận không khớp!";
    alertBox.classList.remove("d-none");
    return;
  }

  registerBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';
  registerBtn.disabled = true;

  // 1. Tạo tài khoản trên hệ thống
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // 2. Lưu thông tin vào Realtime Database
      set(ref(db, "users/" + user.uid), {
        fullName: fullName,
        username: username,
        email: email,
        role: "member", // Đánh dấu đây là thành viên bình thường
        createdAt: new Date().toISOString(),
      })
        .then(() => {
          // Đã lưu xong, báo thành công
          alertBox.className = "alert alert-success";
          alertBox.innerHTML =
            "Đăng ký thành công! Đang chuyển đến trang đăng nhập...";
          alertBox.classList.remove("d-none");

          setTimeout(() => {
            window.location.href = "index.html";
          }, 2000);
        })
        .catch((dbError) => {
          alertBox.className = "alert alert-warning";
          alertBox.innerHTML =
            "Tạo tài khoản thành công nhưng lỗi lưu dữ liệu: " +
            dbError.message;
          alertBox.classList.remove("d-none");
        });
    })
    .catch((error) => {
      registerBtn.innerHTML = "Đăng Ký";
      registerBtn.disabled = false;
      alertBox.className = "alert alert-danger";
      alertBox.classList.remove("d-none");

      if (error.code === "auth/email-already-in-use") {
        alertBox.innerHTML = "Email này đã được sử dụng!";
      } else if (error.code === "auth/weak-password") {
        alertBox.innerHTML = "Mật khẩu quá yếu (cần ít nhất 6 ký tự).";
      } else {
        alertBox.innerHTML = "Lỗi: " + error.message;
      }
    });
});
