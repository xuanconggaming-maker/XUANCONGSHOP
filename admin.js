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
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentEditingUid = null;

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
  // 2. LẤY DANH SÁCH THÀNH VIÊN
  onValue(ref(db, "users"), (snapshot) => {
    const users = snapshot.val();
    const tbody = document.getElementById("user-list-body");
    tbody.innerHTML = "";
    let totalUsers = 0;
    let totalMoney = 0;

    for (let uid in users) {
      totalUsers++;
      const user = users[uid];
      totalMoney += parseInt(user.balance || 0);

      tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="fw-bold text-dark">${user.fullName || "N/A"}</div>
                        <small class="text-muted">@${user.username || "n/a"}</small>
                    </td>
                    <td class="small">${user.email}</td>
                    <td class="fw-bold text-success">${new Intl.NumberFormat("vi-VN").format(user.balance || 0)} đ</td>
                    <td><span class="badge ${user.role === "admin" ? "bg-danger" : "bg-secondary"}">${user.role}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.openEditMoney('${uid}', '${user.fullName}', ${user.balance || 0})">
                            <i class="fa-solid fa-wallet"></i> Sửa tiền
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteUser('${uid}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
    }
    document.getElementById("stat-total-users").innerText = totalUsers;
    document.getElementById("stat-total-money").innerText =
      new Intl.NumberFormat("vi-VN").format(totalMoney) + " đ";
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
  const timeStr =
    now.getFullYear() +
    "-" +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    now.getDate().toString().padStart(2, "0") +
    " " +
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0") +
    ":" +
    now.getSeconds().toString().padStart(2, "0");

  const newNotiRef = push(ref(db, "notifications"));
  set(newNotiRef, {
    text: text,
    time: timeStr,
  }).then(() => {
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

window.deleteUser = (uid) => {
  if (confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
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

// 5. CẬP NHẬT TIỀN VÀ LƯU LỊCH SỬ "ADMIN CỘNG TIỀN"
document.getElementById("saveMoneyBtn").addEventListener("click", () => {
  const newBal = document.getElementById("newBalanceInput").value;

  // Update số dư mới
  update(ref(db, "users/" + currentEditingUid), {
    balance: parseInt(newBal),
  }).then(() => {
    // Ghi log vào lịch sử của khách hàng
    const now = new Date();
    const timeStr =
      now.getFullYear() +
      "-" +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      now.getDate().toString().padStart(2, "0") +
      " " +
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    push(ref(db, "users/" + currentEditingUid + "/transactions"), {
      time: timeStr,
      amount: parseInt(newBal),
      type: "admin", // Đánh dấu để trang Nạp Tiền tự hiểu là Admin làm
      status: "THÀNH CÔNG",
    });
    // Trong file admin.js
    const currentTotalDeposit = userData.totalDeposit || 0;
    update(ref(db, "users/" + currentEditingUid), {
      balance: parseInt(newBal),
      totalDeposit: currentTotalDeposit + (parseInt(newBal) - userData.balance), // Cộng thêm phần tiền nạp mới vào tổng nạp
    });

    // Đóng Popup và báo thành công
    bootstrap.Modal.getInstance(
      document.getElementById("editMoneyModal"),
    ).hide();
    alert("Đã cập nhật số dư thành công!");
  });
});
