import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  push,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentEditingUid = null;

// Biến lưu trạng thái sửa Đơn hàng
let currentEditOrderUid = null;
let currentEditOrderKey = null;
let currentEditOrderTotal = 0;

// 1. KIỂM TRA QUYỀN TRUY CẬP
onAuthStateChanged(auth, (user) => {
  if (user) {
    onValue(ref(db, "users/" + user.uid), (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.role === "admin") {
        loadAdminDashboard();
      } else {
        alert("Bạn không có quyền truy cập trang này!");
        window.location.replace("trang-chu.html");
      }
    });
  } else {
    window.location.replace("index.html");
  }
});

function loadAdminDashboard() {
  // 2. LẤY DANH SÁCH THÀNH VIÊN VÀ QUÉT TOÀN BỘ ĐƠN HÀNG
  onValue(ref(db, "users"), (snapshot) => {
    const users = snapshot.val();
    const tbody = document.getElementById("user-list-body");
    const ordersTbody = document.getElementById("all-orders-body");

    tbody.innerHTML = "";
    ordersTbody.innerHTML = "";

    let totalUsers = 0;
    let totalMoney = 0;
    let allOrders = []; // Mảng gộp tất cả đơn hàng hệ thống

    for (let uid in users) {
      totalUsers++;
      const user = users[uid];
      totalMoney += parseInt(user.balance || 0);

      // Render danh sách User
      tbody.innerHTML += `
        <tr>
            <td>
                <div class="fw-bold text-dark">${user.fullName || "Khách hàng"}</div>
                <small class="text-muted">@${user.username || "n/a"}</small>
            </td>
            <td class="small">${user.email}</td>
            <td class="fw-bold text-success">${new Intl.NumberFormat("vi-VN").format(user.balance || 0)} đ</td>
            <td><span class="badge ${user.role === "admin" ? "bg-danger" : "bg-secondary"}">${user.role || "user"}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="window.openEditMoney('${uid}', '${user.fullName || "Khách"}', ${user.balance || 0})">
                    <i class="fa-solid fa-wallet"></i> Nạp/Trừ tiền
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.deleteUser('${uid}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
      `;

      // Gom toàn bộ Đơn hàng của User này vào mảng chung
      if (user.orders) {
        for (let orderKey in user.orders) {
          let order = user.orders[orderKey];
          order.uid = uid;
          order.username = user.fullName || user.username || "Khách";
          order.orderKey = orderKey;
          allOrders.push(order);
        }
      }
    }

    // Cập nhật thống kê
    document.getElementById("stat-total-users").innerText = totalUsers;
    document.getElementById("stat-total-money").innerText =
      new Intl.NumberFormat("vi-VN").format(totalMoney) + " đ";
    document.getElementById("stat-total-orders").innerText = allOrders.length;

    // Sắp xếp đơn hàng: Mới nhất lên trên
    allOrders.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Render bảng Quản lý Đơn hàng
    allOrders.forEach((o) => {
      let badgeClass = "bg-warning text-dark";
      if (o.status === "Hoàn thành") badgeClass = "bg-success";
      if (o.status === "Đã hủy") badgeClass = "bg-danger";

      ordersTbody.innerHTML += `
            <tr>
                <td class="text-muted fw-bold">${o.orderId}</td>
                <td class="fw-medium">${o.username}</td>
                <td class="small text-truncate" style="max-width: 150px;" title="${o.packageName}">${o.packageName}</td>
                <td><a href="${o.uid_fb}" target="_blank" class="text-primary text-decoration-none d-inline-block text-truncate" style="max-width: 120px;" title="${o.uid_fb}">${o.uid_fb}</a></td>
                <td>${new Intl.NumberFormat("vi-VN").format(o.qty)}</td>
                <td class="text-danger fw-bold">${new Intl.NumberFormat("vi-VN").format(o.total)} đ</td>
                <td><span class="badge ${badgeClass}">${o.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.openEditOrder('${o.uid}', '${o.orderKey}', '${o.orderId}', '${o.status}', ${o.total})">
                        <i class="fa-solid fa-pen-to-square"></i> Cập nhật
                    </button>
                </td>
            </tr>
        `;
    });

    if (allOrders.length === 0) {
      ordersTbody.innerHTML =
        '<tr><td colspan="8" class="py-4 text-muted">Chưa có đơn hàng nào trong hệ thống</td></tr>';
    }
  });

  // 3. LẤY LỊCH SỬ THÔNG BÁO
  onValue(ref(db, "notifications"), (snapshot) => {
    const notis = snapshot.val();
    const container = document.getElementById("noti-history-list");
    container.innerHTML = "";
    let count = 0;

    for (let id in notis) {
      count++;
      const n = notis[id];
      container.innerHTML += `
                <div class="alert alert-light border d-flex justify-content-between align-items-center mb-2">
                    <div class="small">
                        <div class="fw-bold text-dark">${n.text}</div>
                        <div class="text-muted" style="font-size:10px">${n.time}</div>
                    </div>
                    <button class="btn btn-sm text-danger" onclick="window.deleteNoti('${id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
    }
    document.getElementById("stat-total-noti").innerText = count;
  });
}

// 4. CHỨC NĂNG THÊM THÔNG BÁO
document.getElementById("notiForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("notiText").value;
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  push(ref(db, "notifications"), { text: text, time: timeStr }).then(() => {
    document.getElementById("notiText").value = "";
    alert("Đã gửi thông báo thành công!");
  });
});

// GẮN CÁC HÀM VÀO WINDOW ĐỂ GỌI TỪ HTML
window.openEditMoney = (uid, name, balance) => {
  currentEditingUid = uid;
  document.getElementById("targetUserName").innerText = name;
  document.getElementById("newBalanceInput").value = balance;
  new bootstrap.Modal(document.getElementById("editMoneyModal")).show();
};

window.openEditOrder = (uid, orderKey, orderId, currentStatus, total) => {
  currentEditOrderUid = uid;
  currentEditOrderKey = orderKey;
  currentEditOrderTotal = total;
  document.getElementById("targetOrderId").innerText = orderId;
  document.getElementById("newOrderStatus").value = currentStatus;
  new bootstrap.Modal(document.getElementById("editOrderModal")).show();
};

window.deleteUser = (uid) => {
  if (
    confirm(
      "Bạn có chắc chắn muốn xóa thành viên này? Dữ liệu sẽ mất vĩnh viễn!",
    )
  ) {
    remove(ref(db, "users/" + uid));
  }
};

window.deleteNoti = (id) => {
  if (confirm("Xóa thông báo này?")) {
    remove(ref(db, "notifications/" + id));
  }
};

document.getElementById("adminLogout").addEventListener("click", () => {
  signOut(auth).then(() => window.location.replace("index.html"));
});

// 5. CẬP NHẬT SỐ DƯ (Đã sửa lỗi bug)
document.getElementById("saveMoneyBtn").addEventListener("click", async () => {
  const newBal = parseInt(document.getElementById("newBalanceInput").value);
  if (isNaN(newBal)) return;

  const btn = document.getElementById("saveMoneyBtn");
  btn.innerText = "Đang xử lý...";
  btn.disabled = true;

  try {
    const userRef = ref(db, "users/" + currentEditingUid);
    const snap = await get(userRef); // Fetch dữ liệu hiện tại trước khi sửa

    if (snap.exists()) {
      const uData = snap.val();
      const currentBal = parseInt(uData.balance) || 0;
      const currentTotalDeposit = parseInt(uData.totalDeposit) || 0;

      let newTotalDeposit = currentTotalDeposit;
      if (newBal > currentBal) {
        newTotalDeposit += newBal - currentBal; // Cộng phần nạp thêm vào Tổng Nạp
      }

      await update(userRef, { balance: newBal, totalDeposit: newTotalDeposit });

      const now = new Date();
      const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // Ghi Log giao dịch
      await push(ref(db, "users/" + currentEditingUid + "/transactions"), {
        time: timeStr,
        amount: newBal - currentBal, // Có thể cộng hoặc trừ
        type: "admin",
        status: "THÀNH CÔNG",
        syntax: "Admin điều chỉnh số dư",
      });

      bootstrap.Modal.getInstance(
        document.getElementById("editMoneyModal"),
      ).hide();
      alert("Đã cập nhật số dư thành công!");
    }
  } catch (e) {
    alert("Có lỗi xảy ra, vui lòng thử lại!");
  } finally {
    btn.innerText = "Cập nhật ngay";
    btn.disabled = false;
  }
});

// 6. DUYỆT / HỦY ĐƠN HÀNG TỪ ADMIN
document.getElementById("saveOrderBtn").addEventListener("click", async () => {
  const newStatus = document.getElementById("newOrderStatus").value;
  const btn = document.getElementById("saveOrderBtn");
  btn.innerText = "Đang xử lý...";
  btn.disabled = true;

  try {
    const orderRef = ref(
      db,
      `users/${currentEditOrderUid}/orders/${currentEditOrderKey}`,
    );
    const orderSnap = await get(orderRef);

    if (orderSnap.exists()) {
      const oldStatus = orderSnap.val().status;

      if (oldStatus === "Đã hủy" && newStatus !== "Đã hủy") {
        alert(
          "Đơn này đã hủy và hoàn tiền rồi. Không thể chuyển lại trạng thái khác!",
        );
        btn.innerText = "Cập nhật";
        btn.disabled = false;
        return;
      }

      // Cập nhật trạng thái
      await update(orderRef, { status: newStatus });

      // XỬ LÝ HOÀN TIỀN NẾU HỦY
      if (newStatus === "Đã hủy" && oldStatus !== "Đã hủy") {
        const userRef = ref(db, `users/${currentEditOrderUid}`);
        const snap = await get(userRef);
        if (snap.exists()) {
          const uData = snap.val();
          const currentBal = parseInt(uData.balance) || 0;

          await update(userRef, {
            balance: currentBal + currentEditOrderTotal,
          });

          const now = new Date();
          const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

          await push(ref(db, `users/${currentEditOrderUid}/transactions`), {
            time: timeStr,
            amount: currentEditOrderTotal,
            type: "refund",
            status: "THÀNH CÔNG",
            syntax: `Hoàn tiền hủy đơn: ${document.getElementById("targetOrderId").innerText}`,
          });

          alert("Đã Cập nhật Hủy đơn và Tự động hoàn tiền cho khách!");
        }
      } else {
        alert("Cập nhật trạng thái thành công!");
      }
    }
    bootstrap.Modal.getInstance(
      document.getElementById("editOrderModal"),
    ).hide();
  } catch (e) {
    alert("Lỗi kết nối CSDL!");
  } finally {
    btn.innerText = "Lưu thay đổi";
    btn.disabled = false;
  }
});
