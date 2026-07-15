let editingProductId = null;
let appInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- Auth UI ---
    document.getElementById('googleSignIn').addEventListener('click', async () => {
        try {
            await window.firebaseAuth.signInWithGoogle();
        } catch (err) {
            alert('Sign-in failed: ' + err.message);
        }
    });

    document.getElementById('signOutBtn').addEventListener('click', async () => {
        await window.firebaseAuth.signOut();
    });

    // --- Auth State Listener ---
    window.firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appContainer').style.display = '';
            document.getElementById('userName').textContent = user.displayName || user.email;
            await initApp();
        } else {
            document.getElementById('loginScreen').style.display = '';
            document.getElementById('appContainer').style.display = 'none';
        }
    });
});

async function initApp() {
    if (appInitialized) {
        await loadProducts();
        return;
    }
    appInitialized = true;

    await productDB.open();
    addLineItemRow();
    await loadProducts();
    registerServiceWorker();

    // --- Event Listeners ---
    document.getElementById('openModal').addEventListener('click', () => {
        clearForm();
        openProductModal();
    });
    document.getElementById('closeDialog').addEventListener('click', closeProductModal);
    document.getElementById('addNewItem').addEventListener('click', saveAndNew);
    document.getElementById('saveChanges').addEventListener('click', saveAndClose);
    document.getElementById('addLineItem').addEventListener('click', addLineItemRow);
    document.getElementById('targetMarkup').addEventListener('input', recalculate);
}

// --- Line Items Management ---

function addLineItemRow() {
    const tbody = document.getElementById('lineItemsBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="Item name" required></td>
        <td><input type="number" class="item-price" placeholder="0.00" min="0" step="0.01" required></td>
        <td><input type="number" class="item-qty" placeholder="1" min="1" step="1" value="1" required></td>
        <td class="subtotal">$0.00</td>
        <td><button class="btn btn-danger remove-row">&times;</button></td>
    `;
    tbody.appendChild(row);
    bindRowEvents(row);
}

function bindRowEvents(row) {
    const priceInput = row.querySelector('.item-price');
    const qtyInput = row.querySelector('.item-qty');
    const removeBtn = row.querySelector('.remove-row');

    priceInput.addEventListener('input', () => { updateRowSubtotal(row); recalculate(); });
    qtyInput.addEventListener('input', () => { updateRowSubtotal(row); recalculate(); });
    removeBtn.addEventListener('click', () => {
        row.remove();
        recalculate();
    });
}

function updateRowSubtotal(row) {
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const qty = parseInt(row.querySelector('.item-qty').value) || 0;
    row.querySelector('.subtotal').textContent = `₱${(price * qty).toFixed(2)}`;
}

// --- Pricing Calculation ---

function recalculate() {
    const rows = document.querySelectorAll('#lineItemsBody tr');
    let baseCost = 0;

    rows.forEach(row => {
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const qty = parseInt(row.querySelector('.item-qty').value) || 0;
        baseCost += price * qty;
    });

    const markupInput = document.getElementById('targetMarkup');
    const markup = parseFloat(markupInput.value) || 10;
    const markupAmount = baseCost * (markup / 100);
    const finalPrice = baseCost + markupAmount;

    document.getElementById('baseCost').textContent = `₱${baseCost.toFixed(2)}`;
    document.getElementById('markupPercent').textContent = markup;
    document.getElementById('markupAmount').textContent = `₱${markupAmount.toFixed(2)}`;
    document.getElementById('finalPrice').textContent = `₱${finalPrice.toFixed(2)}`;
}

// --- Save Product ---

async function saveProduct() {
    const productName = document.getElementById('productName').value.trim();
    if (!productName) {
        alert('Please enter a product name.');
        return false;
    }

    const rows = document.querySelectorAll('#lineItemsBody tr');
    const lineItems = [];

    for (const row of rows) {
        const name = row.querySelector('.item-name').value.trim();
        const price = parseFloat(row.querySelector('.item-price').value);
        const qty = parseInt(row.querySelector('.item-qty').value);

        if (!name || isNaN(price) || isNaN(qty)) {
            alert('Please fill in all line item fields.');
            return false;
        }

        lineItems.push({
            itemName: name,
            itemPricePerQuantity: price,
            quantity: qty
        });
    }

    if (lineItems.length === 0) {
        alert('Please add at least one line item.');
        return false;
    }

    const markup = parseFloat(document.getElementById('targetMarkup').value) || 10;
    const baseCost = lineItems.reduce((sum, item) => sum + item.itemPricePerQuantity * item.quantity, 0);
    const markupAmount = baseCost * (markup / 100);
    const finalPrice = baseCost + markupAmount;

    const product = {
        name: productName,
        lineItems,
        markupPercent: markup,
        baseCost,
        markupAmount,
        finalPrice
    };

    if (editingProductId !== null) {
        product.id = editingProductId;
        product.createdAt = new Date().toISOString();
        await productDB.update(product);
    } else {
        await productDB.add(product);
    }
    loadProducts();
    return true;
}

async function saveAndClose() {
    const saved = await saveProduct();
    if (saved) closeProductModal();
}

async function saveAndNew() {
    const saved = await saveProduct();
    if (saved) resetForm();
}

function clearForm() {
    editingProductId = null;
    document.getElementById('productName').value = '';
    document.getElementById('targetMarkup').value = '10';
    document.getElementById('lineItemsBody').innerHTML = '';
    document.getElementById('modalTitle').textContent = 'Create Product Bundle';
    addLineItemRow();
    recalculate();
}

function resetForm() {
    editingProductId = null;
    document.getElementById('productName').value = '';
    document.getElementById('targetMarkup').value = '10';
    document.getElementById('lineItemsBody').innerHTML = '';
    document.getElementById('modalTitle').textContent = 'Create Product Bundle';
    addLineItemRow();
    recalculate();
}

async function editProduct(id) {
    const product = await productDB.get(id);
    if (!product) return;

    editingProductId = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('targetMarkup').value = product.markupPercent;
    document.getElementById('lineItemsBody').innerHTML = '';

    product.lineItems.forEach(item => {
        const tbody = document.getElementById('lineItemsBody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="item-name" value="${escapeHtml(item.itemName)}" required></td>
            <td><input type="number" class="item-price" value="${item.itemPricePerQuantity}" min="0" step="0.01" required></td>
            <td><input type="number" class="item-qty" value="${item.quantity}" min="1" step="1" required></td>
            <td class="subtotal">₱${(item.itemPricePerQuantity * item.quantity).toFixed(2)}</td>
            <td><button class="btn btn-danger remove-row">&times;</button></td>
        `;
        tbody.appendChild(row);
        bindRowEvents(row);
    });

    document.getElementById('modalTitle').textContent = 'Edit Product Bundle';
    recalculate();
    openProductModal();
}

// --- Load & Render Saved Products ---

async function loadProducts() {
    const products = await productDB.getAll();
    const container = document.getElementById('productList');

    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">No saved products yet.</div>';
        return;
    }

    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card-header">
                <h3>${escapeHtml(product.name)} <span class="markup-label">(${product.markupPercent}%)</span></h3>
                <span class="product-card-price">₱${product.finalPrice.toFixed(2)}</span>
            </div>
            <div class="product-card-actions data-actions">
                <button class="btn btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        await productDB.delete(id);
        loadProducts();
    }
}

// --- Utility ---

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Modal ---

function openProductModal() {
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// --- Service Worker Registration ---

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}

// Expose functions to global scope for inline onclick handlers (required for ES modules)
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;