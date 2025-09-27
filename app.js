import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhdkokwouhekfkrylybg.supabase.co'
const supabaseKey = 'TU_SUPABASE_KEY'  // Reemplaza con tu clave
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener("DOMContentLoaded", () => {
  const weekContent = document.getElementById("week-content")
  const loginModal = document.getElementById("login-modal")
  const loginBtn = document.getElementById("login-btn")
  const closeModal = document.getElementById("close-modal")
  const loginForm = document.getElementById("login-form")
  const uploadSection = document.getElementById("upload-section")
  const uploadForm = document.getElementById("upload-form")
  const uploadInput = document.getElementById("upload-input")
  const weekScroll = document.getElementById("week-scroll")

  let isAdmin = false

  // ===== MODAL LOGIN =====
  loginBtn.addEventListener("click", () => {
    loginModal.style.display = "flex"
  })

  closeModal.addEventListener("click", () => {
    loginModal.style.display = "none"
  })

  window.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.style.display = "none"
  })

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") loginModal.style.display = "none"
  })

  // ===== LOGIN ADMIN =====
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault() // Evita recarga de página
    const email = document.getElementById("admin-email").value
    const pass = document.getElementById("admin-pass").value

    if (email === "geison.c.samaniego@gmail.com" && pass === "Gsam123") {
      isAdmin = true
      uploadSection.style.display = "block"
      loginModal.style.display = "none"
      alert("Bienvenido admin")
      cargarTodosLosDocumentos()
    } else {
      alert("Credenciales incorrectas")
    }
  })

  // ===== GENERAR BOTONES SEMANAS 1-16 =====
  for (let i = 1; i <= 16; i++) {
    const btn = document.createElement("button")
    btn.textContent = `Semana ${i}`
    btn.classList.add("week-btn")
    btn.type = "button" // Evita submit
    btn.addEventListener("click", () => cargarDocumentosPorSemana(i))
    weekScroll.appendChild(btn)
  }

  // ===== BOTON TODAS =====
  document.getElementById("all-weeks-btn").addEventListener("click", cargarTodosLosDocumentos)

  // ===== FUNCIONES =====
  async function cargarTodosLosDocumentos() {
    weekContent.innerHTML = "<p>Cargando documentos...</p>"
    const { data, error } = await supabase.from("documentos").select("*").order("semana", { ascending: true })
    if (error) {
      weekContent.innerHTML = "<p>Error al cargar documentos.</p>"
      console.error(error)
      return
    }
    if (!data || data.length === 0) {
      weekContent.innerHTML = "<p>No hay documentos registrados.</p>"
      return
    }
    mostrarDocumentos(data)
  }

  async function cargarDocumentosPorSemana(semana) {
    weekContent.innerHTML = "<p>Cargando documentos...</p>"
    const { data, error } = await supabase
      .from("documentos")
      .select("*")
      .eq("semana", semana)
      .order("created_at", { ascending: true })

    if (error) {
      weekContent.innerHTML = "<p>Error al cargar documentos.</p>"
      console.error(error)
      return
    }
    if (!data || data.length === 0) {
      weekContent.innerHTML = `<p>No hay documentos para la semana ${semana}.</p>`
      return
    }
    mostrarDocumentos(data)
  }

  function mostrarDocumentos(documentos) {
    const semanas = {}
    documentos.forEach(doc => {
      if (!semanas[doc.semana]) semanas[doc.semana] = []
      semanas[doc.semana].push(doc)
    })

    weekContent.innerHTML = ""
    Object.keys(semanas).forEach(semana => {
      const section = document.createElement("div")
      section.classList.add("semana-section")
      section.innerHTML = `<h3>Semana ${semana}</h3>`

      semanas[semana].forEach(doc => {
        const div = document.createElement("div")
        div.classList.add("doc-item")
        div.innerHTML = `
          <p><strong>${doc.nombre}</strong></p>
          <a href="${doc.url}" target="_blank" class="btn">Ver</a>
          <a href="${doc.url}" download class="btn">Descargar</a>
        `

        if (isAdmin) {
          const delBtn = document.createElement("button")
          delBtn.textContent = "Eliminar"
          delBtn.classList.add("btn", "btn-danger")
          delBtn.type = "button"
          delBtn.onclick = async () => {
            const { error } = await supabase.from("documentos").delete().eq("id", doc.id)
            if (!error) {
              alert("Documento eliminado")
              cargarTodosLosDocumentos()
            } else {
              alert("Error al eliminar")
              console.error(error)
            }
          }
          div.appendChild(delBtn)
        }

        section.appendChild(div)
      })

      weekContent.appendChild(section)
    })
  }

  // ===== SUBIR DOCUMENTOS =====
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (uploadInput.files.length === 0) return alert("Selecciona un archivo")

    const file = uploadInput.files[0]
    const fileName = `${Date.now()}_${file.name}`

    // Subida a Supabase Storage
    const { data, error } = await supabase.storage.from("documentos").upload(fileName, file)
    if (error) {
      alert("Error al subir archivo")
      console.error(error)
      return
    }

    // Insertar registro en tabla documentos (semana 1 por defecto)
    const { error: insertError } = await supabase.from("documentos").insert([{
      nombre: file.name,
      url: `${supabaseUrl}/storage/v1/object/public/documentos/${fileName}`,
      semana: 1
    }])

    if (insertError) {
      alert("Error al guardar documento")
      console.error(insertError)
      return
    }

    alert("Documento subido correctamente")
    uploadInput.value = ""
    cargarTodosLosDocumentos()
  })
})
