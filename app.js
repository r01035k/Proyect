document.getElementById("all-weeks-btn").addEventListener("click", async () => {
  weekContent.innerHTML = "<p>Cargando documentos...</p>";

  // Traer todos los documentos de la tabla
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("semana", { ascending: true }); // ordena por semana

  if (error) {
    weekContent.innerHTML = "<p>Error al cargar documentos.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    weekContent.innerHTML = "<p>No hay documentos registrados.</p>";
    return;
  }

  // Agrupar los documentos por semana
  const semanas = {};
  data.forEach(doc => {
    if (!semanas[doc.semana]) {
      semanas[doc.semana] = [];
    }
    semanas[doc.semana].push(doc);
  });

  // Mostrar cada semana con sus documentos
  weekContent.innerHTML = "";
  Object.keys(semanas).forEach(numSemana => {
    const section = document.createElement("div");
    section.classList.add("semana-section");
    section.innerHTML = `<h3>Semana ${numSemana}</h3>`;

    semanas[numSemana].forEach(doc => {
      const div = document.createElement("div");
      div.classList.add("document-item");
      div.innerHTML = `
        <p><strong>${doc.nombre}</strong></p>
        <a href="${doc.url}" target="_blank" class="btn">Ver</a>
        <a href="${doc.url}" download class="btn">Descargar</a>
      `;

      // Si es admin, botón de eliminar
      if (isAdmin) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.classList.add("btn", "btn-danger");
        delBtn.onclick = async () => {
          const { error: deleteError } = await supabase
            .from("documentos")
            .delete()
            .eq("id", doc.id);

          if (!deleteError) {
            document.getElementById("all-weeks-btn").click(); // recargar todo
          } else {
            alert("Error al eliminar");
            console.error(deleteError);
          }
        };
        div.appendChild(delBtn);
      }

      section.appendChild(div);
    });

    weekContent.appendChild(section);
  });
});
