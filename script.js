import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Đổi sang Realtime Database để đồng bộ với toàn hệ thống
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
// Nhập cấu hình chung
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

window.signOutUser = () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// HIỂN THỊ THÔNG BÁO CHÀO MỪNG
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
  localStorage.removeItem("showWelcome");
}

// KIỂM TRA ĐĂNG NHẬP VÀ ĐỒNG BỘ DỮ LIỆU TỪ REALTIME DATABASE
onAuthStateChanged(auth, (user) => {
  const isAuthPage =
    window.location.pathname.includes("index.html") ||
    window.location.pathname.includes("dang-ky.html");

  if (user) {
    if (isAuthPage) {
      window.location.href = "trang-chu.html";
      return;
    }

    const userRef = ref(db, "users/" + user.uid);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        document
          .querySelectorAll(".user-fullname-display")
          .forEach((el) => (el.innerText = data.fullName || "User"));

        const encodedName = encodeURIComponent(data.fullName || "User");
        document.querySelectorAll(".user-avatar-display").forEach((img) => {
          img.src = `https://ui-avatars.com/api/?name=${encodedName}&background=adc7ff&color=002e68`;
        });

        document.querySelectorAll(".user-balance-display").forEach((el) => {
          const balanceNum = parseInt(data.balance) || 0;
          el.innerText =
            new Intl.NumberFormat("vi-VN").format(balanceNum) + " VNĐ";
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

// LOGIC TÍNH TIỀN TỰ ĐỘNG
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
