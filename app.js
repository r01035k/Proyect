document.addEventListener("DOMContentLoaded", () => {

  // ------------------ Conexión Supabase ------------------
  const SUPABASE_URL = 'https://lhdkokwouhekfkrylybg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZGtva3dvdWhla2ZrcnlseWJnIiwicm9sZSI6ImF0IjoxNzU4OTExNzE3LCJleHAiOjIwNzQ0ODc3MTd9.5BZoCLqCkqHyU7Neq0efRof_sXSzmmuOOLG-3wKMUYs';
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ------------------ Variables ------------------
  let isAdmin = false;
  const adminCredenciales = {
      correo: "Geison.c.samaniego@gmail.com",
      password: "GSam123"
  };

  // Elementos DOM
  const loginBtn = document.getElementById("login-btn");
  const uploadSection = document.getElementById("upload-section");
  const uploadInput = document.getElementById("upload-input");
  const uploadBtn = document.getElementById("upload-btn");

  const loginModal = document.getElementById("login-modal");
  const closeModal = document.getElementById("close-modal");
  const modalLoginBtn = document.getElementById("modal-login-btn");
  const adminEmailInput = document.getElementById("admin-email");
  const adminPassInput = document.getElementById("admin-pass");

  const weekScroll = document.getElementById("week-scroll");
  const weekContent = document.getElementById("week-content");

  let semanas = Array.from({length:16},(_,i)=>`Semana ${i+1}`);
  let semanaSeleccionada = 0;

  // ------------------ Funciones ------------------

  async function cargarDocumentos(semana) {
      const { data, error } = await supabase
          .from('documentos')
          .select('*')
          .eq('semana', `Semana ${semana}`)
          .order('created_at', { ascending: false });

      if(error) return alert("Error cargando documentos: "+error.message);

      weekContent.innerHTML = "";

      data.forEach(doc => {
          const div = document.createElement("div");
          div.className = "doc-item";

          const url = `${SUPABASE_URL}/storage/v1/object/public/archivos/${doc.nombre}`;
          div.innerHTML = `<a href="${url}" target="_blank">${doc.nombre}</a>`;

          if(isAdmin){
              const delBtn = document.createElement("button");
              delBtn.className = "btn";
              delBtn.style.marginLeft = "10px";
              delBtn.textContent = "Eliminar";
              delBtn.addEventListener("click", async ()=>{
                  if(confirm(`¿Eliminar ${doc.nombre}?`)){
                      await supabase.storage.from('archivos').remove([doc.nombre]);
                      await supabase.from('documentos').delete().eq('id', doc.id);
                      cargarDocumentos(semanaSeleccionada + 1);
                  }
              });
              div.appendChild(delBtn);
          }

          weekContent.appendChild(div);
      });
  }

  function seleccionarSemana(index){
      semanaSeleccionada = index;
      const buttons = document.querySelectorAll(".week-btn");
      buttons.forEach((btn,i)=>btn.classList.toggle("active", i===index));
      cargarDocumentos(index+1);
  }

  // ------------------ Login Modal ------------------
  loginBtn.addEventListener("click", ()=>{ loginModal.style.display="flex"; });
  closeModal.addEventListener("click", ()=>{ loginModal.style.display="none"; });
  window.addEventListener("click", (e)=>{ if(e.target===loginModal) loginModal.style.display="none"; });

  modalLoginBtn.addEventListener("click", ()=>{
      const correo = adminEmailInput.value;
      const pass = adminPassInput.value;

      if(correo === adminCredenciales.correo && pass === adminCredenciales.password){
          isAdmin = true;
          alert("¡Inicio de sesión exitoso!");
          loginBtn.style.display="none";
          uploadSection.style.display="flex";
          loginModal.style.display="none";
          adminEmailInput.value = "";
          adminPassInput.value = "";
          cargarDocumentos(semanaSeleccionada+1);
      } else {
          alert("Correo o contraseña incorrectos");
          adminPassInput.value = "";
      }
  });

  // ------------------ Subida de documentos ------------------
  uploadBtn.addEventListener("click", async ()=>{
      const file = uploadInput.files[0];
      if(!file) return alert("Selecciona un archivo primero");

      const { data, error } = await supabase.storage.from('archivos').upload(file.name, file, { upsert: true });
      if(error) return alert("Error subiendo archivo: "+error.message);

      const { error: errInsert } = await supabase.from('documentos').insert([
          { nombre: file.name, semana: `Semana ${semanaSeleccionada+1}` }
      ]);
      if(errInsert) return alert("Error guardando en DB: "+errInsert.message);

      uploadInput.value="";
      cargarDocumentos(semanaSeleccionada+1);
  });

  // ------------------ Inicialización ------------------
  semanas.forEach((sem,index)=>{
      const btn = document.createElement("button");
      btn.className = "week-btn";
      btn.innerText = sem;
      btn.addEventListener("click", ()=>seleccionarSemana(index));
      weekScroll.appendChild(btn);
  });

  seleccionarSemana(0);

});
