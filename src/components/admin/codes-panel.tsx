"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Loader2, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
type Code = {
  code: string;
  clientName: string;
  clientType: string;
  active: boolean;
  bound: boolean;
  expiresAt: string | null;
  note: string;
  lastUsedAt: string | null;
};
type Form = {
  clientName: string;
  clientType: string;
  expiresAt: string;
  note: string;
};
const empty: Form = {
  clientName: "",
  clientType: "standalone",
  expiresAt: "",
  note: "",
};
const input =
  "w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white";
function status(c: Code) {
  return !c.active
    ? "Revogado"
    : c.expiresAt && new Date(c.expiresAt) <= new Date()
      ? "Expirado"
      : "Ativo";
}
export function CodesPanel() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [created, setCreated] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/codes");
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Erro ao carregar.");
      setCodes(d.codes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const request = async (method: string, body: Record<string, unknown>) => {
    const r = await fetch(
      "/api/admin/codes" +
        (method === "DELETE"
          ? `?code=${encodeURIComponent(String(body.code))}`
          : ""),
      {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method !== "DELETE" ? { body: JSON.stringify(body) } : {}),
      },
    );
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || "Operação não concluída.");
    return d;
  };
  const act = async (method: string, body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await request(method, body);
      await load();
      toast({ title: "Código atualizado" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request(editing ? "PATCH" : "POST", {
        ...form,
        ...(editing ? { code: editing } : {}),
        ...(form.expiresAt
          ? {
              expiresAt: new Date(
                form.expiresAt + "T23:59:59-03:00",
              ).toISOString(),
            }
          : form.clientType === "library"
            ? { expiresAt: null }
            : {}),
      });
      setCreated(data.created?.[0] || "");
      setEditing(null);
      setForm(empty);
      await load();
      toast({ title: editing ? "Cliente atualizado" : "Código gerado" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };
  const visible = useMemo(
    () =>
      codes.filter(
        (c) =>
          (filter === "Todos" || status(c) === filter) &&
          `${c.code} ${c.clientName} ${c.note}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [codes, search, filter],
  );
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Código copiado" });
    } catch {
      setError(
        "Não foi possível copiar. Selecione e copie o código manualmente.",
      );
    }
  };
  return (
    <div className="space-y-6 text-white">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-400">
          Admin Master
        </p>
        <h1 className="mt-2 text-2xl font-bold">Clientes e acessos</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Acesso completo ao Studio com sua sessão administrativa. Cada código
          de cliente permite um navegador e uma sessão ativa.
        </p>
        <a
          className="mt-3 inline-block text-sm text-orange-300 underline"
          href="/mockup-caneca-3d/studio"
        >
          Abrir Studio com acesso FULL →
        </a>
      </div>
      <form
        onSubmit={save}
        className="rounded-2xl border border-white/10 bg-[#151515] p-5"
      >
        <h2 className="mb-5 font-semibold">
          {editing ? `Editar ${editing}` : "Liberar acesso de um cliente"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            Nome do cliente
            <input
              className={input}
              value={form.clientName}
              required
              maxLength={120}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm">
            Tipo de cliente
            <select
              className={input}
              value={form.clientType}
              onChange={(e) => setForm({ ...form, clientType: e.target.value })}
            >
              <option value="standalone">Avulso · R$ 12,90 / 24 horas</option>
              <option value="library">Biblioteca Click Gruda · incluso</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            Validade
            <input
              type="date"
              className={input}
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <span className="block text-xs text-neutral-500">
              {editing
                ? "Mantenha a data ou escolha uma nova. Biblioteca pode ficar sem prazo."
                : form.clientType === "standalone"
                  ? "Em branco: 24 horas exatas a partir da liberação."
                  : "Em branco: sem prazo. Revogue se a assinatura for encerrada."}
            </span>
          </label>
          <label className="space-y-2 text-sm">
            Observações
            <input
              className={input}
              value={form.note}
              maxLength={120}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            disabled={busy}
            className="rounded-xl bg-orange-500 px-5 py-2 font-semibold text-black disabled:opacity-50"
          >
            {busy
              ? "Salvando…"
              : editing
                ? "Salvar alterações"
                : "Gerar código"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="px-3 text-sm text-neutral-400"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      {created && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <span>
            Envie ao cliente: <strong className="font-mono">{created}</strong>
          </span>
          <button
            onClick={() => copy(created)}
            className="flex items-center gap-2 text-sm"
          >
            <Copy size={15} />
            Copiar
          </button>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Search size={18} />
        <input
          aria-label="Buscar clientes"
          placeholder="Nome, código ou observação"
          className={input + " max-w-sm"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Status"
          className={input + " max-w-40"}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["Todos", "Ativo", "Expirado", "Revogado"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button onClick={load} aria-label="Atualizar lista">
          <RefreshCw size={18} />
        </button>
      </div>
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5">
              <tr>
                {[
                  "Cliente / código",
                  "Plano",
                  "Status / navegador",
                  "Validade",
                  "Gerenciar",
                ].map((h) => (
                  <th key={h} className="p-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr className="border-t border-white/10" key={c.code}>
                  <td className="p-4">
                    <strong>{c.clientName || "Cliente não informado"}</strong>
                    <button
                      className="mt-1 block font-mono text-xs text-neutral-400"
                      onClick={() => copy(c.code)}
                    >
                      {c.code} ⧉
                    </button>
                    {c.note && (
                      <p className="mt-1 text-xs text-neutral-500">{c.note}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {c.clientType === "library" ? "Biblioteca" : "Avulso 24h"}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        status(c) === "Ativo"
                          ? "text-green-400"
                          : "text-red-300"
                      }
                    >
                      {status(c)}
                    </span>
                    <p className="text-xs text-neutral-500">
                      {c.bound ? "Navegador vinculado" : "Aguardando ativação"}
                    </p>
                  </td>
                  <td className="p-4">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("pt-BR")
                      : "Sem prazo"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <button
                        disabled={busy}
                        className="text-orange-300"
                        onClick={() => {
                          setEditing(c.code);
                          setForm({
                            clientName: c.clientName,
                            clientType: c.clientType,
                            note: c.note,
                            expiresAt: c.expiresAt?.slice(0, 10) || "",
                          });
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          act("PATCH", {
                            code: c.code,
                            active: !c.active,
                            clientName: c.clientName || "Cliente legado",
                          })
                        }
                      >
                        {c.active ? "Revogar" : "Reativar"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              "Liberar a troca de navegador? A sessão atual será encerrada.",
                            )
                          )
                            void act("PATCH", {
                              code: c.code,
                              resetBrowser: true,
                              clientName: c.clientName || "Cliente legado",
                            });
                        }}
                      >
                        Trocar navegador
                      </button>
                      <button
                        disabled={busy}
                        className="text-red-400"
                        onClick={() => {
                          if (
                            confirm(
                              `Excluir ${c.code}? Esta ação encerra o acesso.`,
                            )
                          )
                            void act("DELETE", { code: c.code });
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="p-8 text-center text-neutral-500">
              Nenhum cliente encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
