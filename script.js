function fazerLogin() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msgErro = document.getElementById("msgErro");

  // Usuários de exemplo
  const usuarios = [
    { user: "operador", senha: "1234", perfil: "Operador" },
    { user: "supervisor", senha: "admin", perfil: "Supervisor" }
  ];

  const valido = usuarios.find(u => u.user === usuario && u.senha === senha);

  if (valido) {
    localStorage.setItem("usuarioLogado", JSON.stringify(valido));
    window.location.href = "HTML.html"; // Redireciona
  } else {
    msgErro.textContent = "Usuário ou senha inválidos!";
  }
}
