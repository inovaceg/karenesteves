import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PatientForm } from "@/components/patient-form";

export const Route = createFileRoute("/_authenticated/pacientes/novo")({
  head: () => ({ meta: [{ title: "Novo paciente — Karen Esteves" }, { name: "description", content: "Cadastro de novo paciente." }] }),
  component: Novo,
});

function Novo() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-3xl font-semibold text-primary">Novo paciente</h1>
      <PatientForm
        onSaved={(id) => {
          qc.invalidateQueries({ queryKey: ["patients"] });
          qc.invalidateQueries({ queryKey: ["dashboard-counts"] });
          navigate({ to: "/pacientes/$id", params: { id } });
        }}
      />
    </div>
  );
}
