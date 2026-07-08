// ==========================================
// MOCK DATA: 12 Khởi tạo Container Ban đầu (Phù hợp mốc năm hiện tại 2026)
// ==========================================
const DEFAULT_CONTAINERS = [
    { id: "MSKU1029384", size: "40ft", status: "Có hàng", position: "A-01-01", customer: "Maersk Line", gateIn: "2026-06-20", notes: "Hàng đông lạnh" },
    { id: "COSU7748291", size: "20ft", status: "Rỗng", position: "B-03-02", customer: "COSCO", gateIn: "2026-07-01", notes: "Vỏ sạch tiêu chuẩn" },
    { id: "ONEU4453627", size: "40ft", status: "Có hàng", position: "A-02-04", customer: "ONE Line", gateIn: "2026-06-15", notes: "Hàng nguy hiểm IMO" },
    { id: "CMAU8829103", size: "20ft", status: "Có hàng", position: "C-01-02", customer: "CMA CGM", gateIn: "2026-07-05", notes: "Chờ kiểm hóa" },
    { id: "HPLU3394812", size: "40ft", status: "Rỗng", position: "B-01-01", customer: "Hapag-Lloyd", gateIn: "2026-07-07", notes: "Cần sửa chữa nhẹ" },
    { id: "MSKU5546372", size: "20ft", status: "Có hàng", position: "A-04-01", customer: "Khách hàng A", gateIn: "2026-06-22", notes: "Hàng dệt may nhập khẩu" },
    { id: "YMLU9928174", size: "40ft", status: "Rỗng", position: "B-02-03", customer: "Yang Ming", gateIn: "2026-07-02", notes: "Vỏ tốt đóng hàng" },
    { id: "EVER2293841", size: "40ft", status: "Có hàng", position: "C-03-01", customer: "Evergreen", gateIn: "2026-06-10", notes: "Lưu kho lâu ngày" },
    { id: "OOCL6625142", size: "20ft", status: "Có hàng", position: "A-05-02", customer: "OOCL", gateIn: "2026-07-04", notes: "Hàng điện tử" },
    { id: "HMMU1129384", size: "40ft", status: "Rỗng", position: "B-04-04", customer: "HMM", gateIn: "2026-07-06", notes: "Chờ cấp vỏ" },
    { id: "MSKU8847291", size: "40ft", status: "Có hàng", position: "A-01-02", customer: "Khách hàng A", gateIn: "2026-07-03", notes: "Hàng linh kiện máy móc" },
    { id: "COSU1192834", size: "20ft", status: "Rỗng", position: "B-05-01", customer: "COSCO", gateIn: "2026-06-18", notes: "Hàng trả vỏ" }
];

// Biến toàn cục kiểm soát State của ứng dụng
let containers = JSON.parse(localStorage.getItem('cy_containers')) || DEFAULT_CONTAINERS;
let currentRole = "";
const MAX_CAPACITY = 15; // Giới hạn sức chứa giả định bãi để test cảnh báo quá tải (>90%)

// Cấu hình Phân quyền Menu tương ứng với 6 vai trò
const ROLE_PERMISSIONS = {
    Manager: ["dashboard", "yard", "docs", "equipment"],
    Dispatcher: ["dashboard", "yard"],
    Gate: ["yard"], // Tập trung vào kiểm tra Gate-In / Gate-Out tại bãi
    Documentation: ["docs"],
    Equipment: ["equipment"],
    Customer: ["dashboard", "yard"] // Chỉ xem, trong code sẽ khóa tính năng sửa/xóa
};

// Cấu hình hiển thị Tên Menu Tiếng Việt trực quan
const MENU_LABELS = {
    dashboard: { label: "Bảng Điều Khiển (Dashboard)", icon: "layout-dashboard" },
    yard: { label: "Quản Lý Vị Trí Bãi (Yard)", icon: "box" },
    docs: { label: "Chứng Từ & Vận Đơn", icon: "file-text" },
    equipment: { label: "Thiết Bị Cảng Bãi", icon: "truck" }
};

// Phân trang & Bộ lọc toàn cục
let currentPage = 1;
const pageSize = 5;
let filteredContainers = [...containers];

// Khởi chạy khi tải trang
window.onload = function() {
    document.getElementById('current-time').innerText = `Hôm nay: ${new Date().toLocaleDateString('vi-VN')}`;
    lucide.createIcons();
};

// ==========================================
// HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT GIẢ LẬP
// ==========================================
function handleLogin() {
    currentRole = document.getElementById('role-select').value;
    
    // Lưu tạm vào bộ nhớ hoặc ẩn hiện screen
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('current-role-badge').innerText = document.getElementById('role-select').options[document.getElementById('role-select').selectedIndex].text.split('. ')[1];
    
    // Khởi tạo menu điều hướng dựa theo phân quyền của Role
    buildSidebarMenu();
    
    // Mở trang đầu tiên được phép truy cập
    const defaultTab = ROLE_PERMISSIONS[currentRole][0];
    switchTab(defaultTab);
    
    // Đồng bộ lại dữ liệu lên UI
    refreshDataAndUI();
}

function handleLogout() {
    currentRole = "";
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// Xây dựng thanh điều hướng động
function buildSidebarMenu() {
    const menuNav = document.getElementById('sidebar-menu');
    menuNav.innerHTML = "";
    
    const allowedTabs = ROLE_PERMISSIONS[currentRole];
    allowedTabs.forEach(tabKey => {
        const item = MENU_LABELS[tabKey];
        const btn = document.createElement('button');
        btn.id = `btn-tab-${tabKey}`;
        btn.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition text-slate-400 hover:bg-slate-800 hover:text-white";
        btn.onclick = () => switchTab(tabKey);
        btn.innerHTML = `<i data-lucide="${item.icon}" class="w-4 h-4"></i> <span>${item.label}</span>`;
        menuNav.appendChild(btn);
    });
    lucide.createIcons();
}

// Chuyển đổi các View Tab của Single Page Application
function switchTab(tabKey) {
    const allSections = ["section-dashboard", "section-yard", "section-docs", "section-equipment"];
    allSections.forEach(s => document.getElementById(s).classList.add('hidden'));
    
    // Hiển thị section được chọn
    document.getElementById(`section-${tabKey}`).classList.remove('hidden');
    document.getElementById('page-title').innerText = MENU_LABELS[tabKey].label;
    
    // Đổi màu active trên sidebar menu
    const allowedTabs = ROLE_PERMISSIONS[currentRole];
    allowedTabs.forEach(k => {
        const btn = document.getElementById(`btn-tab-${k}`);
        if(k === tabKey) {
            btn.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition bg-blue-600 text-white";
        } else {
            btn.className = "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition text-slate-400 hover:bg-slate-800 hover:text-white";
        }
    });
}

// ==========================================
// NGHIỆP VỤ HỆ THỐNG & TÍNH TOÁN CHỈ SỐ (DASHBOARD)
// ==========================================
function refreshDataAndUI() {
    // 1. Lưu localStorage để dữ liệu không mất đi khi đổi role test thử
    localStorage.setItem('cy_containers', JSON.stringify(containers));

    // Lọc trước theo đặc thù tài khoản Khách Hàng (Nếu là Customer, chỉ thấy hàng của "Khách hàng A")
    if (currentRole === "Customer") {
        filteredContainers = containers.filter(c => c.customer === "Khách hàng A");
    } else {
        filteredContainers = [...containers];
    }

    // 2. Chạy tính toán số liệu Thống kê Dashboard
    calculateDashboardStats();

    // 3. Render bảng bãi container
    handleFilter(); 
}

function calculateDashboardStats() {
    const total = filteredContainers.length;
    const full = filteredContainers.filter(c => c.status === "Có hàng").length;
    const empty = filteredContainers.filter(c => c.status === "Rỗng").length;
    const occupancyRate = ((total / MAX_CAPACITY) * 100).toFixed(1);

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-full').innerText = full;
    document.getElementById('stat-empty').innerText = empty;
    document.getElementById('stat-occupancy').innerText = `${occupancyRate}%`;

    // Sinh các cảnh báo hệ thống (Alerts)
    const alertContainer = document.getElementById('global-alerts');
    alertContainer.innerHTML = "";

    // Cảnh báo 1: Bãi gần đầy quá tải (>90%)
    if (occupancyRate > 90) {
        alertContainer.innerHTML += `
            <div class="bg-red-50 border-l-4 border-red-500 p-4 text-red-800 rounded-r-lg flex items-center gap-2 text-sm font-medium">
                <i data-lucide="alert-triangle" class="w-5 h-5 text-red-500"></i> CẢNH BÁO: Sức lấp đầy bãi đạt ${occupancyRate}%. Bãi gần như đã quá tải, hạn chế cấp lệnh nhập bãi (Gate-In)!
            </div>
        `;
    }

    // Cảnh báo 2: Kiểm tra Container tồn lâu ngày (> 7 ngày)
    let overstayCount = 0;
    filteredContainers.forEach(c => {
        const days = calculateDaysInYard(c.gateIn);
        if (days > 7) overstayCount++;
    });

    if (overstayCount > 0) {
        alertContainer.innerHTML += `
            <div class="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-800 rounded-r-lg flex items-center gap-2 text-sm font-medium">
                <i data-lucide="clock" class="w-5 h-5 text-amber-500"></i> PHÁT HIỆN: Có <strong>${overstayCount} container</strong> đang tồn bãi quá 7 ngày. Yêu cầu bộ phận Thương vụ thúc giục khách hàng giải phóng!
            </div>
        `;
    }
    lucide.createIcons();
}

// Hàm tính số ngày tồn bãi dựa theo mốc ngày
function calculateDaysInYard(gateInStr) {
    const gateInDate = new Date(gateInStr);
    const today = new Date(); // Thời gian thực tế của hệ thống
    const diffTime = Math.abs(today - gateInDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// CHỨC NĂNG TÌM KIẾM, LỌC VÀ PHÂN TRANG KHU VỰC BÃI
// ==========================================
function handleFilter() {
    const searchVal = document.getElementById('search-box').value.toUpperCase();
    const statusFilter = document.getElementById('filter-status').value;

    let sourceData = (currentRole === "Customer") ? containers.filter(c => c.customer === "Khách hàng A") : containers;

    // Tiến hành lọc tổ hợp
    filteredContainers = sourceData.filter(c => {
        const matchesSearch = c.id.toUpperCase().includes(searchVal) || c.position.toUpperCase().includes(searchVal) || c.customer.toUpperCase().includes(searchVal);
        const matchesStatus = (statusFilter === "All") || (c.status === statusFilter);
        return matchesSearch && matchesStatus;
    });

    currentPage = 1; // Reset về trang 1 khi lọc dữ liệu mới
    renderContainerTable();
}

function renderContainerTable() {
    const tbody = document.getElementById('container-table-body');
    tbody.innerHTML = "";

    // Phân quyền cho Component thao tác và Form nhập liệu
    adjustUIByRolePermissions();

    // Tính toán phân trang
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = filteredContainers.slice(startIdx, endIdx);

    if(pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400">Không tìm thấy container nào phù hợp.</td></tr>`;
        updatePaginationUI(0, 0);
        return;
    }

    pageData.forEach((c, index) => {
        const actualIndex = startIdx + index; // Chỉ số chuẩn trong mảng filtered
        const days = calculateDaysInYard(c.gateIn);
        const isOverstay = days > 7;

        let actionButtons = "";
        
        // Kiểm tra quyền xử lý nghiệp vụ của từng Role
        if (currentRole === "Manager" || currentRole === "Dispatcher") {
            actionButtons = `
                <button onclick="editContainer(${actualIndex})" class="text-blue-600 hover:text-blue-900 font-medium mr-3 text-xs flex inline-items items-center gap-0.5"><i data-lucide="edit" class="w-3 h-3"></i> Sửa</button>
                <button onclick="deleteContainer('${c.id}')" class="text-red-600 hover:text-red-900 font-medium text-xs flex inline-items items-center gap-0.5"><i data-lucide="trash" class="w-3 h-3"></i> Xóa</button>
            `;
        } else if (currentRole === "Gate") {
            actionButtons = `
                <button onclick="gateOutContainer('${c.id}')" class="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-semibold flex inline-items items-center gap-0.5">Xuất Cổng (Gate-Out)</button>
            `;
        } else {
            actionButtons = `<span class="text-xs text-slate-400">Không có quyền</span>`;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition ${isOverstay ? 'bg-red-50/50' : ''}">
                <td class="px-6 py-4 font-mono font-bold text-slate-900">${c.id}</td>
                <td class="px-6 py-4 text-xs">${c.size}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${c.status === 'Có hàng' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${c.status}
                    </span>
                </td>
                <td class="px-6 py-4 font-semibold text-slate-700"><span class="bg-slate-200 px-2 py-0.5 rounded text-xs">${c.position}</span></td>
                <td class="px-6 py-4 text-xs">${c.customer}</td>
                <td class="px-6 py-4 text-xs">${c.gateIn}</td>
                <td class="px-6 py-4">
                    <span class="text-xs font-medium ${isOverstay ? 'text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded' : 'text-slate-600'}">${days} ngày</span>
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">${actionButtons}</td>
            </tr>
        `;
    });

    updatePaginationUI(startIdx + 1, Math.min(endIdx, filteredContainers.length));
    lucide.createIcons();
}

function updatePaginationUI(start, end) {
    document.getElementById('pagination-info').innerText = `Hiển thị ${start}-${end} trên tổng số ${filteredContainers.length} container`;
    document.getElementById('btn-prev').disabled = (currentPage === 1);
    document.getElementById('btn-next').disabled = (currentPage * pageSize >= filteredContainers.length);
}

function changePage(direction) {
    currentPage += direction;
    renderContainerTable();
}

// Ẩn hiện Form hoặc cột hành động dựa theo Quyền thực tế
function adjustUIByRolePermissions() {
    const formBlock = document.getElementById('container-form-block');
    const thActions = document.getElementById('th-actions');

    // Chỉ cho phép Manager và Dispatcher thao tác CRUD trực tiếp trên Form
    if (currentRole === "Manager" || currentRole === "Dispatcher") {
        formBlock.classList.remove('hidden');
        thActions.classList.remove('hidden');
    } else if (currentRole === "Gate") {
        formBlock.classList.add('hidden'); // Nhân viên cổng không tự ý tạo mới, chỉ bấm lệnh Gate-out xuất xe
        thActions.classList.remove('hidden');
    } else {
        formBlock.classList.add('hidden');
        thActions.classList.add('hidden');
    }
}

// ==========================================
// NGHIỆP VỤ THAO TÁC CƠ SỞ DỮ LIỆU (CRUD & VALIDATION)
// ==========================================
function saveContainer(e) {
    e.preventDefault();

    const contId = document.getElementById('cont-id').value.trim().toUpperCase();
    const size = document.getElementById('cont-size').value;
    const status = document.getElementById('cont-status').value;
    const position = document.getElementById('cont-position').value.trim();
    const customer = document.getElementById('cont-customer').value.trim();
    const gateIn = document.getElementById('cont-gatein').value;
    const notes = document.getElementById('cont-notes').value.trim();
    const formIndex = document.getElementById('form-index').value;

    // VALIDATION: Kiểm tra đúng cấu trúc mã chuẩn Container quốc tế (4 chữ + 7 số)
    const contRegex = /^[A-Z]{4}\d{7}$/;
    if (!contRegex.test(contId)) {
        alert("⚠️ Lỗi định dạng: Mã Container không hợp lệ! Bắt buộc gồm 4 ký tự chữ cái viết liền và 7 chữ số phía sau. Ví dụ: MSKU1234567");
        return;
    }

    const containerData = { id: contId, size, status, position, customer, gateIn, notes };

    if (formIndex === "") {
        // Kiểm tra trùng lặp mã khi thêm mới
        if (containers.some(c => c.id === contId)) {
            alert("⚠️ Lỗi: Container này đã tồn tại trong bãi!");
            return;
        }
        // Thêm mới (Gate-In)
        containers.unshift(containerData);
        alert(`🎉 Nhập bãi thành công container: ${contId}`);
    } else {
        // Cập nhật sửa đổi thông tin vị trí
        const origIdx = containers.findIndex(c => c.id === filteredContainers[parseInt(formIndex)].id);
        containers[origIdx] = containerData;
        alert(`✏️ Đã cập nhật thông tin container: ${contId}`);
    }

    resetForm();
    refreshDataAndUI();
}

function editContainer(filteredIdx) {
    const c = filteredContainers[filteredIdx];
    document.getElementById('form-index').value = filteredIdx;
    document.getElementById('cont-id').value = c.id;
    document.getElementById('cont-id').disabled = true; // Không được sửa mã khóa chính
    document.getElementById('cont-size').value = c.size;
    document.getElementById('cont-status').value = c.status;
    document.getElementById('cont-position').value = c.position;
    document.getElementById('cont-customer').value = c.customer;
    document.getElementById('cont-gatein').value = c.gateIn;
    document.getElementById('cont-notes').value = c.notes;

    document.getElementById('form-title').innerHTML = `<i data-lucide="edit" class="text-orange-500"></i> Hiệu chỉnh thông tin Container`;
    document.getElementById('container-form-block').scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

function deleteContainer(contId) {
    if(confirm(`Bạn chắc chắn muốn XÓA container ${contId} khỏi dữ liệu hệ thống?`)) {
        containers = containers.filter(c => c.id !== contId);
        refreshDataAndUI();
    }
}

// Nghiệp vụ Cổng: Xuất bãi bàn giao xe nâng hạ
function gateOutContainer(contId) {
    if(confirm(`[XÁC NHẬN CỔNG] Cấp phiếu thiết bị, cho phép Xe đầu kéo hạ tải và xuất bãi (Gate-Out) container ${contId}?`)) {
        containers = containers.filter(c => c.id !== contId);
        alert(`🚛 Container ${contId} đã chính thức rời bãi cảng.`);
        refreshDataAndUI();
    }
}

function resetForm() {
    document.getElementById('container-form').reset();
    document.getElementById('form-index').value = "";
    document.getElementById('cont-id').disabled = false;
    document.getElementById('form-title').innerHTML = `<i data-lucide="plus-circle" class="text-blue-600"></i> Khai báo / Cập nhật Container`;
    lucide.createIcons();
}

// ==========================================
// CHỨC NĂNG XUẤT BÁO CÁO (EXPORT CSV)
// ==========================================
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Thêm BOM UTF-8 giúp Excel đọc được dấu Tiếng Việt
    csvContent += "Ma Container,Kich Thuoc,Trang Thai,Vi Tri Bai,Khach Hang,Ngay Nhap Bai,Ghi Chu\n";

    filteredContainers.forEach(c => {
        csvContent += `${c.id},${c.size},${c.status},${c.position},${c.customer},${c.gateIn},${c.notes}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_cao_bai_container_${currentRole}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
