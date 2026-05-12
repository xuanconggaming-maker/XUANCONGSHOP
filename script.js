/* script.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* script.js - Cập nhật thông số chuẩn từ ảnh image_41c760.png */
const firebaseConfig = {
  apiKey: "AIzaSyCL2_GUT6UpzkRKZEZBtVLSszVF-Eit70Q",
  authDomain: "xuan-cong-shop.firebaseapp.com",
  projectId: "xuan-cong-shop",
  storageBucket: "xuan-cong-shop.firebasestorage.app",
  messagingSenderId: "998898360975",
  appId: "1:998898360975:web:f9860800aaa3dc1f5606fa", // Lấy đúng mã này từ ảnh image_41c760.png
  measurementId: "G-W2S51NH9VM", // Lấy đúng mã này từ ảnh image_41c760.png
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

window.signOutUser = () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// HIỂN THỊ THÔNG BÁO CHÀO MỪNG (Nếu có cờ showWelcome)
if (localStorage.getItem("showWelcome") === "true") {
  const toastContainer = document.createElement("div");
  toastContainer.style.position = "fixed";
  toastContainer.style.top = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.zIndex = "9999";
  toastContainer.innerHTML = `
        <div class="toast align-items-center text-bg-success border-0 show shadow-lg" role="alert">
            <div class="d-flex">
            <div class="toast-body fw-bold" style="font-size: 15px;">
                <i class="fa-solid fa-circle-check me-2"></i> Đăng nhập thành công!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
  document.body.appendChild(toastContainer);
  setTimeout(() => {
    if (toastContainer) toastContainer.remove();
  }, 3500);
  localStorage.removeItem("showWelcome"); // Xóa cờ để F5 không hiện lại
}

// KIỂM TRA ĐĂNG NHẬP VÀ ĐỒNG BỘ DỮ LIỆU
onAuthStateChanged(auth, (user) => {
  const isAuthPage =
    window.location.pathname.includes("index.html") ||
    window.location.pathname.includes("dang-ky.html");

  if (user) {
    if (isAuthPage) {
      window.location.href = "trang-chu.html";
      return;
    }

    onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        document
          .querySelectorAll(".user-fullname-display")
          .forEach((el) => (el.innerText = data.fullName));

        const encodedName = encodeURIComponent(data.fullName);
        document.querySelectorAll(".user-avatar-display").forEach((img) => {
          img.src = `https://ui-avatars.com/api/?name=${encodedName}&background=adc7ff&color=002e68`;
        });

        document.querySelectorAll(".user-balance-display").forEach((el) => {
          el.innerText =
            new Intl.NumberFormat("vi-VN").format(data.balance) + " VNĐ";
        });

        window.currentUsername = data.username;
        if (typeof window.updateQR === "function") window.updateQR();
      }
    });
  } else {
    if (!isAuthPage) {
      window.location.href = "index.html";
    }
  }
});

// LOGIC TÍNH TIỀN
const qtyInput = document.getElementById("quantity");
const priceDisplay = document.getElementById("totalPrice");
const serviceSelect = document.getElementById("serviceType");

if (qtyInput && priceDisplay && serviceSelect) {
  const priceRates = { fb: 50, tt: 30, ig: 80 };
  function calculateTotal() {
    const qty = parseInt(qtyInput.value) || 0;
    const service = serviceSelect.value;
    let total = 0;
    if (service && priceRates[service]) total = qty * priceRates[service];
    priceDisplay.innerText =
      new Intl.NumberFormat("vi-VN").format(total) + " VNĐ";
  }
  qtyInput.addEventListener("input", calculateTotal);
  serviceSelect.addEventListener("change", calculateTotal);
}
