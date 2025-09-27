// 🛠️ Configura tu Supabase
const supabase = supabase.createClient(
  'https://TU_URL_PROYECTO.supabase.co',
  'TU_ANON_KEY'
);

// 📌 Variables globales
const weekContent = document.getElementById("week-content");
const loginModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const closeModal = document.getElementById("close-modal");
const loginForm = document.getElementById("login-form");
const uploadSection = document.getElementById("upload-section");
const uploadForm = document.getElementById("upload-form");
const uploadInput = document.getElementById("upload-input");
const weekScroll = document.getElementById("week-scroll");

let isAdmin = false;

// 🔓 Admin login
loginBtn.addEventListener("click", () => {
  loginModal.style.display = "flex";
});
closeModal.addEventListener("click", () => {
  loginModal.style.display = "none";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const pass = document.getElementById("admin-pass").value;

  // Validación simple (puedes usar Supabase Auth si prefieres)
  if (email === "admin@admin.com" && pass === "admin123") {
    isAdmin = true;
    uploadSection.style.display = "block";
    loginModal.style.display = "none";
    alert("Sesión iniciada como admin.");
  } else {
    alert("Credenciales incorrectas");
  }
});

// 🔁 Generar botones de semanas (1 a 16)
for (let i = 1; i <= 16; i++) {
  const btn = document.createElement("button");
  btn.textContent = `Semana ${i}`;
  btn.classList.add("week-btn");
  btn.addEventListener("click", () => cargarDocumentosPorSemana(i));
  weekScroll.appendChild(btn);
}

// 🔃 Botón "Todas"
document.getElementById("all-weeks-btn").addEventListener("click", async () => {
  await cargarTodosLosDocumentos();
});

// 📁 Subida de archivo
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = uploadInput.files[0];
  if (!file) return alert("Selecciona un archivo");

  const semanaSeleccionada = prompt("¿A qué semana pertenece este archivo? (1 al 16)");
  if (!semanaSeleccionada || isNaN(semanaSeleccionada)) {
    return alert("Semana no válida");
  }

  // Subir al bucket de Supabase Storage
  const filePath = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    return alert("Error al subir archivo.");
  }

  // Obtener URL pública
  const { data: publicUrlData } = supabase
    .storage
    .from("documentos")
    .getPublicUrl(filePath);

  const url = publicUrlData.publicUrl;

  // Registrar en la tabla
  const { error: insertError } = await supabase
    .from("documentos")
    .insert([{ nombre: file.name, semana: parseInt(semanaSeleccionada), url }]);

  if (insertError) {
    console.error(insertError);
    return alert("Error al registrar documento en la base.");
  }

  alert("Documento subido con éxito.");
  uploadForm.reset();
  cargarTodosLosDocumentos(); // recargar vista
});

// 📥 Cargar todos los documentos
async function cargarTodosLosDocumentos() {
  weekContent.innerHTML = "<p>Cargando documentos...</p>";
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("semana", { ascending: true });

  if (error) {
    weekContent.innerHTML = "<p>Error al cargar documentos.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    weekContent.innerHTML = "<p>No hay documentos registrados.</p>";
    return;
  }

  // Agrupar por semana
  const semanas = {};
  data.forEach(doc => {
    if (!semanas[doc.semana]) semanas[doc.semana] = [];
    semanas[doc.semana].push(doc);
  });

  weekContent.innerHTML = "";
  Object.keys(semanas).forEach(numSemana => {
    const section = document.createElement("div");
    section.innerHTML = `<h3>Semana ${numSemana}</h3>`;

    semanas[numSemana].forEach(doc => {
      const div = document.createElement("div");
      div.classList.add("doc-item");
      div.innerHTML = `
        <p><strong>${doc.nombre}</strong></p>
        <a href="${doc.url}" target="_blank" class="btn">Ver</a>
        <a href="${doc.url}" download class="btn">Descargar</a>
      `;

      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.classList.add("btn");
        delBtn.style.background = "#e74c3c";
        delBtn.style.color = "#fff";
        delBtn.onclick = async () => {
          const { error: deleteError } = await supabase
            .from("documentos")
            .delete()
            .eq("id", doc.id);
          if (deleteError) {
            alert("Error al eliminar");
            console.error(deleteError);
          } else {
            alert("Documento eliminado");
            cargarTodosLosDocumentos();
          }
        };
        div.appendChild(delBtn);
      }

      section.appendChild(div);
    });

    weekContent.appendChild(section);
  });
}

// 📥 Cargar documentos por semana
async function cargarDocumentosPorSemana(semana) {
  weekContent.innerHTML = `<p>Cargando documentos de semana ${semana}...</p>`;
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("semana", semana)
    .order("created_at", { ascending: true });

  if (error) {
    weekContent.innerHTML = "<p>Error al cargar documentos.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    weekContent.innerHTML = `<p>No hay documentos para la semana ${semana}.</p>`;
    return;
  }

  weekContent.innerHTML = "";
  data.forEach(doc => {
    const div = document.createElement("div");
    div.classList.add("doc-item");
    div.innerHTML = `
      <p><strong>${doc.nombre}</strong></p>
      <a href="${doc.url}" target="_blank" class="btn">Ver</a>
      <a href="${doc.url}" download class="btn">Descargar</a>
    `;

    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Eliminar";
      delBtn.classList.add("btn");
      delBtn.style.background = "#e74c3c";
      delBtn.style.color = "#fff";
      delBtn.onclick = async () => {
        const { error: deleteError } = await supabase
          .from("documentos")
          .delete()
          .eq("id", doc.id);
        if (deleteError) {
          alert("Error al eliminar");
          console.error(deleteError);
        } else {
          alert("Documento eliminado");
          cargarDocumentosPorSemana(semana);
        }
      };
      div.appendChild(delBtn);
    }

    weekContent.appendChild(div);
  });
}
