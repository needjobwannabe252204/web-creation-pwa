function openImage(imgOrSrc) {
    var modalImage = document.getElementById("modalImage");
    var imageModal = document.getElementById("imageModal");
    var src = typeof imgOrSrc === 'string' ? imgOrSrc : (imgOrSrc && imgOrSrc.src) || '';
    var alt = typeof imgOrSrc === 'object' && imgOrSrc ? (imgOrSrc.alt || '') : '';
    if (!modalImage || !imageModal) return;
    modalImage.src = src;
    modalImage.alt = alt;
    imageModal.style.display = "flex";
}

function closeImage() {
    var modalImage = document.getElementById("modalImage");
    var imageModal = document.getElementById("imageModal");
    if (!imageModal) return;
    imageModal.style.display = "none";
    if (modalImage) {
        modalImage.src = '';
        modalImage.alt = '';
    }
}

// expose for inline handlers (optional)
window.openImage = openImage;
window.closeImage = closeImage;