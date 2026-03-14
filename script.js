// 1. Khởi tạo CSDL ảo
if (!localStorage.getItem("users")) {
  localStorage.setItem(
    "users",
    JSON.stringify([
      {
        fullname: "Boss Xuân Công",
        email: "admin@xuancongshop.com",
        username: "admin",
        password: "123",
        role: "admin",
      },
    ]),
  );
}
if (!localStorage.getItem("products")) {
  localStorage.setItem(
    "products",
    JSON.stringify([
      {
        id: 1,
        name: "Mẫu Website Bán Hàng",
        price: 388000,
        oldPrice: 800000,
        img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=500",
        category: "Mẫu Website",
      },
    ]),
  );
}
if (!localStorage.getItem("cart"))
  localStorage.setItem("cart", JSON.stringify([]));

function getProducts() {
  return JSON.parse(localStorage.getItem("products"));
}
function setProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}
function getCart() {
  return JSON.parse(localStorage.getItem("cart"));
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// 2. Cập nhật Header & Bấm vào tên để xem thông tin
function updateHeader() {
  const user = getCurrentUser();
  const nav = document.getElementById("nav-menu");
  if (!nav) return;

  const cart = getCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  let cartIcon = `<button onclick="toggleCart()" style="background:none; border:none; color:white; cursor:pointer; font-size: 16px; position: relative;">
                    🛒 Giỏ hàng <span id="cart-count" style="background: var(--primary-color); color: white; border-radius: 50%; padding: 2px 6px; font-size: 12px; font-weight: bold;">${cartCount}</span>
                  </button>`;

  if (!user) {
    nav.innerHTML = `${cartIcon} <button class="btn-primary" style="margin-left: 15px;" onclick="window.location.href='login.html'">Đăng nhập</button>`;
  } else {
    let adminLink =
      user.role === "admin"
        ? `<button class="btn-primary" style="background:#4CAF50; margin-left:15px;" onclick="window.location.href='admin.html'">⚙️ Quản trị</button>`
        : "";
    nav.innerHTML = `
        ${cartIcon}
        <span style="color: var(--text-light); border-left: 1px solid #444; padding-left: 15px; margin-left: 15px;">
            Chào, <b style="color:var(--primary-color); cursor:pointer; text-decoration:underline;" onclick="showUserProfile()" title="Bấm để xem thông tin">${user.username}</b>
        </span>
        ${adminLink}
        <button class="btn-primary" style="background: #333; margin-left: 10px;" onclick="logout()">Đăng xuất</button>
    `;
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// 3. Hệ thống Popup Thông tin Cá Nhân
function showUserProfile() {
  const user = getCurrentUser();
  if (!user) return;

  let modal = document.getElementById("profile-modal-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "profile-modal-overlay";
    modal.className = "profile-modal-overlay";
    document.body.appendChild(modal);
  }

  // Giao diện hiển thị chi tiết khách hàng
  modal.innerHTML = `
        <div class="profile-modal">
            <button class="close-profile" onclick="closeUserProfile()">✕</button>
            <h2>Hồ Sơ Của Bạn</h2>
            <p><span>👤 Họ và tên:</span> <b>${user.fullname || "Chưa cập nhật"}</b></p>
            <p><span>📧 Gmail:</span> <b>${user.email || "Chưa cập nhật"}</b></p>
            <p><span>🔑 Tên đăng nhập:</span> <b>${user.username}</b></p>
            <p><span>🛡️ Quyền hạn:</span> <b style="color: ${user.role === "admin" ? "#4CAF50" : "#2196F3"}">${user.role === "admin" ? "Quản trị viên (Admin)" : "Khách hàng VIP"}</b></p>
        </div>
    `;
  modal.style.display = "flex";
}

function closeUserProfile() {
  const modal = document.getElementById("profile-modal-overlay");
  if (modal) modal.style.display = "none";
}

// 4. Toast Message
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Hiệu ứng nút gợn sóng (giữ nguyên)
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-primary")) {
    const button = e.target;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) existingRipple.remove();
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }
});
