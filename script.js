// 1. Khởi tạo CSDL ảo
if (!localStorage.getItem("users")) {
  localStorage.setItem(
    "users",
    JSON.stringify([{ username: "admin", password: "123", role: "admin" }]),
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
// Khởi tạo Giỏ hàng
if (!localStorage.getItem("cart")) {
  localStorage.setItem("cart", JSON.stringify([]));
}

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

// 2. Cập nhật Header & Đếm số lượng giỏ hàng
function updateHeader() {
  const user = getCurrentUser();
  const nav = document.getElementById("nav-menu");
  if (!nav) return;

  // Tính tổng số lượng sản phẩm trong giỏ
  const cart = getCart();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Nút giỏ hàng có chức năng mở Sidebar
  let cartIcon = `<button onclick="toggleCart()" style="background:none; border:none; color:white; cursor:pointer; font-size: 16px; position: relative;">
                    🛒 Giỏ hàng <span id="cart-count" style="background: var(--primary-color); color: white; border-radius: 50%; padding: 2px 6px; font-size: 12px; font-weight: bold;">${cartCount}</span>
                  </button>`;

  if (!user) {
    nav.innerHTML = `
      ${cartIcon}
      <button class="btn-primary" style="margin-left: 15px;" onclick="window.location.href='login.html'">Đăng nhập</button>
    `;
  } else {
    let adminLink =
      user.role === "admin"
        ? `<button class="btn-primary" style="background:#4CAF50; margin-left:15px;" onclick="window.location.href='admin.html'">⚙️ Quản trị</button>`
        : "";
    nav.innerHTML = `
        ${cartIcon}
        <span style="color: var(--text-light); border-left: 1px solid #444; padding-left: 15px; margin-left: 15px;">Chào, <b style="color:var(--primary-color)">${user.username}</b></span>
        ${adminLink}
        <button class="btn-primary" style="background: #333; margin-left: 10px;" onclick="logout()">Đăng xuất</button>
    `;
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// 3. Hệ thống Thông báo (Toast Message) xịn xò
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

  // Hiển thị
  setTimeout(() => toast.classList.add("show"), 10);
  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300); // Đợi hiệu ứng mờ kết thúc rồi xóa
  }, 3000);
}
