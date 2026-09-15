// ===== CORAL ROSSE CHOCOLATERIA - APP =====

const WHATSAPP_NUMBER = '573132399600';

// Google Sheets - Pega aqui la URL de tu Apps Script desplegado
// (Ver instrucciones en google-apps-script.gs)
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzMsjQ64Xqqh19h7fzhlnsME7FwNWcNcULQSxJXT2zlF24bzI9iCitQqBMUSuqdAsft/exec';

const PRICES = {
    x1: { base: 8000, nutella: 10000 },
    x4: { base: 30000, nutellaExtra: 1500 }
};

const FILLING_NAMES = {
    arequipe: 'Arequipe',
    nutella: 'Nutella',
    frutos_secos: 'Frutos Secos + Arandanos'
};

const TYPE_NAMES = {
    blanco: 'Blanco',
    negro: 'Negro'
};

const MUNICIPALITIES = [
    'Malaga', 'San Jose de Miranda', 'Enciso', 'Concepcion',
    'Cerrito', 'Capitanejo', 'Carcasi', 'Guaca',
    'Macaravita', 'Molagavita', 'San Andres', 'San Miguel'
];

// State
let currentBoxSize = 1;
let cart = [];
let cartIdCounter = 0;

// DOM
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const sizeBtn1 = document.getElementById('sizeBtn1');
const sizeBtn4 = document.getElementById('sizeBtn4');
const chocolatesConfig = document.getElementById('chocolatesConfig');
const boxPriceEl = document.getElementById('boxPrice');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartBadge = document.getElementById('cartBadge');
const cartTotal = document.getElementById('cartTotal');
const subtotalValue = document.getElementById('subtotalValue');
const totalValue = document.getElementById('totalValue');
const deliveryForm = document.getElementById('deliveryForm');
const sendWhatsApp = document.getElementById('sendWhatsApp');
const municipalityInput = document.getElementById('municipality');
const municipalityDropdown = document.getElementById('municipalityDropdown');
const boxMessageInput = document.getElementById('boxMessage');
const msgCount = document.getElementById('msgCount');
const catalogModal = document.getElementById('catalogModal');

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
});

// ===== MOBILE MENU =====
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    toggleOverlay();
});

function toggleOverlay() {
    let overlay = document.querySelector('.nav-overlay');
    if (navMenu.classList.contains('open')) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay open';
            overlay.addEventListener('click', closeMenu);
            document.body.appendChild(overlay);
        } else {
            overlay.classList.add('open');
        }
    } else if (overlay) {
        overlay.classList.remove('open');
    }
}

function closeMenu() {
    navMenu.classList.remove('open');
    const overlay = document.querySelector('.nav-overlay');
    if (overlay) overlay.classList.remove('open');
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// ===== CATALOG MODAL =====
document.getElementById('openCatalogBtn').addEventListener('click', (e) => {
    e.preventDefault();
    catalogModal.classList.add('open');
    document.body.style.overflow = 'hidden';
});
document.getElementById('openCatalogBtn2').addEventListener('click', () => {
    catalogModal.classList.add('open');
    document.body.style.overflow = 'hidden';
});
document.getElementById('closeCatalog').addEventListener('click', () => {
    catalogModal.classList.remove('open');
    document.body.style.overflow = '';
});
catalogModal.addEventListener('click', (e) => {
    if (e.target === catalogModal) {
        catalogModal.classList.remove('open');
        document.body.style.overflow = '';
    }
});

// ===== BOX SIZE =====
sizeBtn1.addEventListener('click', () => selectBoxSize(1));
sizeBtn4.addEventListener('click', () => selectBoxSize(4));

function selectBoxSize(size) {
    currentBoxSize = size;
    sizeBtn1.classList.toggle('active', size === 1);
    sizeBtn4.classList.toggle('active', size === 4);
    renderChocolateConfig();
    updateBoxPrice();
}

// ===== CHOCOLATE CONFIG =====
function renderChocolateConfig() {
    let html = '';
    for (let i = 0; i < currentBoxSize; i++) {
        html += `
            <div class="choco-config-card" data-index="${i}">
                <div class="choco-config-number">${i + 1}</div>
                <select class="choco-type-select" data-index="${i}" onchange="updateBoxPrice()">
                    <option value="blanco">Blanco</option>
                    <option value="negro" ${i % 2 !== 0 ? 'selected' : ''}>Negro</option>
                </select>
                <select class="choco-filling-select" data-index="${i}" onchange="updateBoxPrice()">
                    <option value="arequipe">Arequipe</option>
                    <option value="nutella">Nutella</option>
                    <option value="frutos_secos">Frutos Secos</option>
                </select>
            </div>
        `;
    }
    chocolatesConfig.innerHTML = html;
}

function getConfiguredChocolates() {
    const chocolates = [];
    for (let i = 0; i < currentBoxSize; i++) {
        const typeSelect = document.querySelector(`.choco-type-select[data-index="${i}"]`);
        const fillingSelect = document.querySelector(`.choco-filling-select[data-index="${i}"]`);
        if (typeSelect && fillingSelect) {
            chocolates.push({ type: typeSelect.value, filling: fillingSelect.value });
        }
    }
    return chocolates;
}

function calculateBoxPrice(chocolates) {
    if (chocolates.length === 1) {
        return chocolates[0].filling === 'nutella' ? PRICES.x1.nutella : PRICES.x1.base;
    }
    const nutellaCount = chocolates.filter(c => c.filling === 'nutella').length;
    return PRICES.x4.base + (nutellaCount * PRICES.x4.nutellaExtra);
}

function updateBoxPrice() {
    const chocolates = getConfiguredChocolates();
    boxPriceEl.textContent = formatPrice(calculateBoxPrice(chocolates));
}

function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
}

// ===== MESSAGE COUNTER =====
boxMessageInput.addEventListener('input', () => {
    msgCount.textContent = boxMessageInput.value.length;
});

// ===== ADD TO CART =====
addToCartBtn.addEventListener('click', () => {
    const chocolates = getConfiguredChocolates();
    const price = calculateBoxPrice(chocolates);
    const message = boxMessageInput.value.trim();

    cartIdCounter++;
    cart.push({
        id: cartIdCounter,
        size: currentBoxSize,
        chocolates: [...chocolates],
        price,
        message
    });

    // Reset message field
    boxMessageInput.value = '';
    msgCount.textContent = '0';

    renderCart();
    showToast('Caja agregada al carrito');
});

// ===== CART =====
function renderCart() {
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.innerHTML = '';
        cartTotal.style.display = 'none';
        cartBadge.textContent = '0';
        deliveryForm.style.display = 'none';
        return;
    }

    cartEmpty.style.display = 'none';
    cartTotal.style.display = 'block';
    deliveryForm.style.display = 'block';
    cartBadge.textContent = cart.length;

    let html = '';
    cart.forEach(box => {
        const details = box.chocolates.map((c, i) =>
            `${i + 1}. ${TYPE_NAMES[c.type]} - ${FILLING_NAMES[c.filling]}`
        ).join('<br>');

        const msgHtml = box.message
            ? `<div class="cart-item-message">"${box.message}"</div>`
            : '';

        html += `
            <div class="cart-item" data-id="${box.id}">
                <div class="cart-item-info">
                    <div class="cart-item-title">Caja x${box.size}</div>
                    <div class="cart-item-details">${details}</div>
                    ${msgHtml}
                    <div class="cart-item-price">${formatPrice(box.price)}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${box.id})" title="Eliminar">&times;</button>
            </div>
        `;
    });
    cartItems.innerHTML = html;

    const total = cart.reduce((sum, box) => sum + box.price, 0);
    subtotalValue.textContent = formatPrice(total);
    totalValue.textContent = formatPrice(total);
}

function removeFromCart(id) {
    cart = cart.filter(box => box.id !== id);
    renderCart();
}

// ===== MUNICIPALITY =====
municipalityInput.addEventListener('focus', () => {
    municipalityDropdown.classList.add('open');
    filterMunicipalities('');
});
municipalityInput.addEventListener('input', (e) => {
    municipalityDropdown.classList.add('open');
    filterMunicipalities(e.target.value);
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#municipalitySelect')) {
        municipalityDropdown.classList.remove('open');
    }
});

function filterMunicipalities(query) {
    const q = query.toLowerCase();
    municipalityDropdown.querySelectorAll('li').forEach(item => {
        item.classList.toggle('hidden', q !== '' && !item.dataset.value.toLowerCase().includes(q));
    });
}

municipalityDropdown.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
        municipalityInput.value = li.dataset.value;
        municipalityDropdown.classList.remove('open');
    });
});

// ===== MIN DATE =====
function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('deliveryDate').min = `${yyyy}-${mm}-${dd}`;
}

// ===== VALIDATION =====
function validateForm() {
    const fields = [
        { id: 'clientName', label: 'nombre' },
        { id: 'clientPhone', label: 'telefono' },
        { id: 'municipality', label: 'municipio' },
        { id: 'address', label: 'direccion' },
        { id: 'deliveryDate', label: 'fecha de entrega' },
        { id: 'deliveryTime', label: 'hora de entrega' }
    ];

    let valid = true;
    let firstError = null;

    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.payment-card').forEach(c => c.style.borderColor = '');

    for (const field of fields) {
        const input = document.getElementById(field.id);
        if (!input.value.trim()) {
            input.classList.add('error');
            valid = false;
            if (!firstError) firstError = input;
        }
    }

    const munValue = municipalityInput.value.trim();
    if (munValue && !MUNICIPALITIES.some(m => m.toLowerCase() === munValue.toLowerCase())) {
        municipalityInput.classList.add('error');
        valid = false;
        if (!firstError) firstError = municipalityInput;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        valid = false;
        document.querySelectorAll('.payment-card').forEach(card => {
            card.style.borderColor = '#e74c3c';
        });
        if (!firstError) firstError = document.querySelector('.payment-options');
    }

    if (!valid && firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Por favor completa todos los campos requeridos');
    }

    return valid;
}

// ===== WHATSAPP =====
sendWhatsApp.addEventListener('click', () => {
    if (cart.length === 0) {
        showToast('Agrega al menos una caja al carrito');
        return;
    }
    if (!validateForm()) return;

    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const municipality = municipalityInput.value.trim();
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('deliveryDate').value;
    const time = document.getElementById('deliveryTime').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const notes = document.getElementById('orderNotes').value.trim();

    const dateObj = new Date(date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const total = cart.reduce((sum, box) => sum + box.price, 0);

    let msg = `*PEDIDO - CORAL ROSSE CHOCOLATERIA*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*CLIENTE*\n`;
    msg += `Nombre: ${name}\n`;
    msg += `Telefono: ${phone}\n\n`;

    msg += `*DETALLE DEL PEDIDO*\n`;

    cart.forEach((box, idx) => {
        msg += `\nCaja ${idx + 1} (x${box.size}) - ${formatPrice(box.price)}\n`;
        box.chocolates.forEach((c, i) => {
            msg += `  ${i + 1}. ${TYPE_NAMES[c.type]} - ${FILLING_NAMES[c.filling]}\n`;
        });
        if (box.message) {
            msg += `  Mensaje: "${box.message}"\n`;
        }
    });

    msg += `\n*TOTAL: ${formatPrice(total)}*\n`;
    msg += `_(Domicilio con costo adicional)_\n\n`;

    msg += `*ENTREGA*\n`;
    msg += `Municipio: ${municipality}\n`;
    msg += `Direccion: ${address}\n`;
    msg += `Fecha: ${dateFormatted}\n`;
    msg += `Hora: ${time}\n\n`;

    msg += `*PAGO:* ${paymentMethod}\n`;

    if (notes) {
        msg += `\n*NOTAS:* ${notes}\n`;
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━`;

    // Enviar a Google Sheets (en segundo plano)
    sendToGoogleSheets({
        nombre: name,
        telefono: phone,
        municipio: municipality,
        direccion: address,
        fechaEntrega: dateFormatted,
        horaEntrega: time,
        cajas: cart.map(box => ({
            size: box.size,
            chocolates: box.chocolates,
            message: box.message
        })),
        cantidadCajas: cart.length,
        total: total,
        metodoPago: paymentMethod,
        notas: notes
    });

    // Abrir WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

    // Limpiar carrito y formulario
    cart = [];
    cartIdCounter = 0;
    renderCart();
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    municipalityInput.value = '';
    document.getElementById('address').value = '';
    document.getElementById('deliveryDate').value = '';
    document.getElementById('deliveryTime').value = '';
    document.querySelectorAll('input[name="paymentMethod"]').forEach(r => r.checked = false);
    document.getElementById('orderNotes').value = '';
    showToast('Pedido enviado - carrito limpiado');
});

// ===== GOOGLE SHEETS (via iframe para evitar CORS) =====
function sendToGoogleSheets(data) {
    if (!GOOGLE_SHEETS_URL) return;

    // Crear iframe oculto como destino del formulario
    const iframe = document.createElement('iframe');
    iframe.name = 'sheets-frame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Crear formulario con los datos como campo oculto
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_SHEETS_URL;
    form.target = 'sheets-frame';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Limpiar iframe despues de unos segundos
    setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 5000);
}

// ===== TOAST =====
function showToast(text) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

// ===== SCROLL LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== SCROLL ANIMATIONS =====
function animateOnScroll() {
    const elements = document.querySelectorAll('.choco-type-card, .filling-card, .pricing-card, .order-builder, .cart, .delivery-form');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = entry.target.classList.contains('pricing-featured')
                    ? 'scale(1.03) translateY(0)' : 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    renderChocolateConfig();
    updateBoxPrice();
    setMinDate();
    animateOnScroll();
});
