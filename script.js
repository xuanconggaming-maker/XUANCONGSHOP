// Khởi tạo dữ liệu mặc định nếu chưa có
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
        name: "Laptop Gaming",
        price: 25000000,
        img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
        category: "Công nghệ",
      },
    ]),
  );
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

// Cập nhật thanh Header chung
function updateHeader() {
  const user = getCurrentUser();
  const nav = document.getElementById("nav-menu");
  if (!nav) return;

  if (!user) {
    nav.innerHTML = `<a href="login.html" class="btn-primary">Đăng nhập</a>`;
  } else {
    let adminLink =
      user.role === "admin" ? `<a href="admin.html">Quản trị</a>` : "";
    nav.innerHTML = `
            <span style="color: var(--primary-color)">Chào, ${user.username}</span>
            ${adminLink}
            <button onclick="logout()">Đăng xuất</button>
        `;
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}
