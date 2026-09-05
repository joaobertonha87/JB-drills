import Court from "../components/Court";

export default function Editor(){
  return (
    <div className="app">
      <header>
        <h1>JB Tactics</h1>
        <div>
          <button>Salvar</button>
          <button>Exportar</button>
        </div>
      </header>

      <section className="workspace">
        <aside>
          <button>👤 Jogador</button>
          <button>🎾 Bola</button>
          <button>🔵 Cone</button>
          <button>➡️ Seta</button>
          <button>✏️ Desenho</button>
        </aside>

        <main>
          <Court />
        </main>
      </section>
    </div>
  );
}