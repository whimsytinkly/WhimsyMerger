function initTabs(container) {
    if (!container) {
        return;
    }
    const tabs = container.querySelectorAll(".tabs .tab");
    const panels = container.querySelectorAll("[data-tab-content]");
    if (!tabs.length) {
        return;
    }
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const selectedTab = tab.dataset.tab;
            tabs.forEach(otherTab => {
                otherTab.classList.toggle("active", otherTab === tab);
            });
            panels.forEach(panel => {
                const isActive = panel.dataset.tabContent === selectedTab;
                panel.classList.toggle("active", isActive);
                panel.hidden = !isActive;
            });
        });
    });
}

document.querySelectorAll("[data-tabs]").forEach(container => {
    initTabs(container);
});

function showToast(container) {
    if (!container) {
        return;
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "This is a toast notification.";
    container.innerHTML = "";
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }
    , 3000);
}

document.querySelectorAll("[data-toast-trigger]").forEach(trigger => {
    trigger.addEventListener("click", () => {
        const container = document.querySelector("[data-toast-container]");
        showToast(container);
    });
});
// ================================
// Table Configuration
// ================================
const tableConfig = {
    pageSize: 10, position: "bottom", maxPagesShown: 5, controls: {
        previous: true, next: true, pages: true, first: false, last: false
    }
}
;
// ================================
// Render Table
// ================================

function renderTable(target, data) {
    const container = typeof target === "string" ? document.querySelector(target): target;
    if (!container) {
        return;
    }
    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "";
        return;
    }
    const columns = Object.keys(data[0]);
    const totalPages = Math.ceil(data.length / tableConfig.pageSize);
    renderTablePage(container, data, columns, 1, totalPages);
}
// ================================
// Render Table Page
// ================================

function renderTablePage(container, data, columns, currentPage, totalPages) {
    const pageSize = tableConfig.pageSize;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const visibleRows = data.slice(startIndex, endIndex);
    // ================================
    // Table
    // ================================
    const table = document.createElement("table");
    table.className = "table";
    // ================================
    // Header
    // ================================
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(column => {
        const th = document.createElement("th");
        th.textContent = formatTableLabel(column);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    // ================================
    // Body
    // ================================
    const tbody = document.createElement("tbody");
    visibleRows.forEach(row => {
        const tr = document.createElement("tr");
        columns.forEach(column => {
            const td = document.createElement("td");
            td.textContent = row[column] ?? "";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    // ================================
    // Wrapper
    // ================================
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    wrapper.appendChild(table);
    // ================================
    // Pagination
    // ================================
    const pagination = document.createElement("div");
    pagination.className = "table-pagination";
    wrapper.appendChild(pagination);
    container.innerHTML = "";
    container.appendChild(wrapper);
    renderTablePagination(pagination, data, columns, currentPage, totalPages);
}
// ================================
// Format Column Label
// ================================

function formatTableLabel(key) {
    return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
// ================================
// Render Pagination
// ================================

function renderTablePagination(container, data, columns, currentPage, totalPages) {
    const settings = tableConfig;
    const controls = settings.controls;
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }
    const maxPages = Math.max(1, Math.min(settings.maxPagesShown, totalPages));
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    const jumpSize = maxPages;
    const previousJumpPage = Math.max(1, startPage - jumpSize);
    const nextJumpPage = Math.min(totalPages, endPage + jumpSize);
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "table-pagination-controls";
    // ================================
    // Button Helper
    // ================================
    function createButton(label, page, className, disabled = false) {
        const button = document.createElement("button");
        button.className = "button " + className + " button-small";
        button.type = "button";
        button.textContent = label;
        button.dataset.tablePage = page;
        button.disabled = disabled;
        button.addEventListener("click", () => {
            const nextPage = Number(button.dataset.tablePage);
            if (!Number.isFinite(nextPage)) {
                return;
            }
            renderTablePage(container.parentElement, data, columns, nextPage, totalPages);
        });
        return button;
    }
    // ================================
    // First
    // ================================
    if (controls.first) {
        controlsContainer.appendChild(createButton("First", 1, "button-secondary", currentPage === 1));
    }
    // ================================
    // Previous
    // ================================
    if (controls.previous) {
        controlsContainer.appendChild(createButton("Previous", Math.max(1, currentPage - 1), "button-secondary", currentPage === 1));
    }
    // ================================
    // Left Ellipsis
    // ================================
    if (controls.pages && startPage > 1) {
        controlsContainer.appendChild(createButton("...", previousJumpPage, "button-secondary"));
    }
    // ================================
    // Page Numbers
    // ================================
    if (controls.pages) {
        for (let page = startPage;
        page <= endPage;
        page++) {
            controlsContainer.appendChild(createButton(String(page), page, page === currentPage ? "button-primary": "button-secondary"));
        }
    }
    // ================================
    // Right Ellipsis
    // ================================
    if (controls.pages && endPage < totalPages) {
        controlsContainer.appendChild(createButton("...", nextJumpPage, "button-secondary"));
    }
    // ================================
    // Next
    // ================================
    if (controls.next) {
        controlsContainer.appendChild(createButton("Next", Math.min(totalPages, currentPage + 1), "button-secondary", currentPage === totalPages));
    }
    // ================================
    // Last
    // ================================
    if (controls.last) {
        controlsContainer.appendChild(createButton("Last", totalPages, "button-secondary", currentPage === totalPages));
    }
    container.innerHTML = "";
    container.appendChild(controlsContainer);
}