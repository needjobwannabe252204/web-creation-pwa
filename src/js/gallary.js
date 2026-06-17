function openImage(src) {
    document.getElementById("modalImage").src = src;
    document.getElementById("imageModal").style.display = "flex";
}

function closeImage() {
    document.getElementById("imageModal").style.display = "none";
}

// expose for inline handlers (optional)
window.openImage = openImage;
window.closeImage = closeImage;