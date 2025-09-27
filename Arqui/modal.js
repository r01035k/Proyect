document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn")
  const loginModal = document.getElementById("login-modal")
  const closeModal = document.getElementById("close-modal")

  // Abrir modal
  loginBtn.addEventListener("click", () => {
    loginModal.classList.add("show")
  })

  // Cerrar modal con X
  closeModal.addEventListener("click", () => {
    loginModal.classList.remove("show")
  })

  // Cerrar modal clic fuera
  window.addEventListener("click", (e) => {
    if(e.target === loginModal) loginModal.classList.remove("show")
  })

  // Cerrar modal con Escape
  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape") loginModal.classList.remove("show")
  })
})
