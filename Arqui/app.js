
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://evrymhfnvaketvhoezil.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)



// Credenciales de admin
const ADMIN_EMAIL = 'geison.c.samaniego@gmail.com'
const ADMIN_PASS = 'Gsam123'

// Variables globales
let isAdmin = false
const loginBtn = document.getElementById('login-btn')
const loginModal = document.getElementById('login-modal')
const closeModal = document.getElementById('close-modal')
const loginForm = document.getElementById('login-form')
const uploadSection = document.getElementById('upload-section')
const uploadForm = document.getElementById('upload-form')
const uploadInput = document.getElementById('upload-input')
const selectSemana = document.getElementById('select-semana')
const weekScroll = document.getElementById('week-scroll')
const weekContent = document.getElementById('week-content')
const allWeeksBtn = document.getElementById('all-weeks-btn')

// ====== MODAL LOGIN ======
loginBtn.addEventListener('click', () => loginModal.classList.add('show'))
closeModal.addEventListener('click', () => loginModal.classList.remove('show'))
window.addEventListener('click', e => { if (e.target == loginModal) loginModal.classList.remove('show') })
window.addEventListener('keydown', e => { if(e.key === 'Escape') loginModal.classList.remove('show') })

loginForm.addEventListener('submit', e => {
  e.preventDefault()
  const email = document.getElementById('admin-email').value
  const pass = document.getElementById('admin-pass').value
  if(email === ADMIN_EMAIL && pass === ADMIN_PASS){
    isAdmin = true
    uploadSection.style.display = 'block'
    loginModal.classList.remove('show')
    alert('¡Bienvenido Admin!')
    renderDocuments()  // recarga documentos para mostrar botones de eliminar
  } else {
    alert('Acceso denegado')
  }
})

// ====== GENERAR BOTONES DE SEMANAS ======
for(let i=1; i<=16; i++){
  const btn = document.createElement('button')
  btn.classList.add('week-btn')
  btn.textContent = `Semana ${i}`
  btn.dataset.semana = i
  btn.addEventListener('click', () => renderDocuments(i))
  weekScroll.appendChild(btn)

  // Opciones del select para subir archivo
  const option = document.createElement('option')
  option.value = i
  option.textContent = `Semana ${i}`
  selectSemana.appendChild(option)
}

// ====== LISTAR DOCUMENTOS ======
allWeeksBtn.addEventListener('click', () => renderDocuments())

async function renderDocuments(semana = null){
  weekContent.innerHTML = '<p>Cargando documentos...</p>'
  let query = supabase.from('documentos').select('*').order('semana', {ascending:true})
  if(semana) query = query.eq('semana', semana)
  const { data, error } = await query
  if(error) { weekContent.innerHTML = '<p>Error al cargar documentos.</p>'; console.error(error); return }
  if(!data || data.length===0){ weekContent.innerHTML = '<p>No hay documentos.</p>'; return }

  weekContent.innerHTML = ''
  const grouped = {}
  data.forEach(doc => { grouped[doc.semana] ? grouped[doc.semana].push(doc) : grouped[doc.semana]=[doc] })

  Object.keys(grouped).forEach(s => {
    const section = document.createElement('div')
    section.classList.add('semana-section')
    section.innerHTML = `<h3>Semana ${s}</h3>`

    grouped[s].forEach(doc => {
      const div = document.createElement('div')
      div.classList.add('doc-item')
      div.innerHTML = `
        <p><strong>${doc.nombre}</strong></p>
        <a href="${doc.url}" target="_blank" class="btn">Ver</a>
        <a href="${doc.url}" download class="btn">Descargar</a>
      `
      if(isAdmin){
        const delBtn = document.createElement('button')
        delBtn.textContent = 'Eliminar'
        delBtn.classList.add('btn', 'btn-danger')
        delBtn.onclick = async () => {
          const { error: delError } = await supabase.from('documentos').delete().eq('id', doc.id)
          if(delError) { alert('Error al eliminar'); console.error(delError) }
          else renderDocuments(semana)
        }
        div.appendChild(delBtn)
      }
      section.appendChild(div)
    })
    weekContent.appendChild(section)
  })
}

// ====== SUBIR DOCUMENTOS ======
uploadForm.addEventListener('submit', async e => {
  e.preventDefault()
  const file = uploadInput.files[0]
  const semana = selectSemana.value
  if(!file || !semana){ alert('Selecciona archivo y semana'); return }

  const filePath = `${Date.now()}_${file.name}`
  const { data, error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file)
  if(uploadError){ alert('Error al subir archivo'); console.error(uploadError); return }

  const url = supabase.storage.from('documentos').getPublicUrl(filePath).data.publicUrl
  const { error: dbError } = await supabase.from('documentos').insert([{ nombre: file.name, semana: parseInt(semana), url }])
  if(dbError){ alert('Error al guardar en DB'); console.error(dbError); return }

  alert('Documento subido correctamente')
  uploadInput.value = ''
  renderDocuments()
})

// ====== CARGAR TODOS LOS DOCUMENTOS AL INICIO ======
renderDocuments()