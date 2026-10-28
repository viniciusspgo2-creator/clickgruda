"use client";

import { Sparkles } from "lucide-react";
import type { MugState } from "../state/store";
import { CERAMIC_FINISHES, ceramicFinishValues, type CeramicFinish } from "../lib/ceramic-finishes";
import { SliderRow } from "./controls";

export function CeramicFinishControls({ mug, onChange, onApplyAll, disabled }: {
  mug: Partial<MugState>;
  onChange: (values: CeramicFinish | Partial<CeramicFinish>) => void;
  onApplyAll?: (values: CeramicFinish) => void;
  disabled?: boolean;
}) {
  const values = ceramicFinishValues(mug);
  const percent = (v: number) => `${Math.round(v * 100)}%`;
  return <fieldset disabled={disabled} className="cg-finish-controls">
    <legend><Sparkles /> Acabamento do esmalte</legend>
    <div className="cg-finish-presets">
      {CERAMIC_FINISHES.map(finish => <button key={finish.id} type="button" title={finish.description}
        aria-pressed={Object.entries(finish.values).every(([key, value]) => Math.abs(values[key as keyof CeramicFinish]! - value) < 0.001)}
        onClick={() => onChange(finish.values)}>{finish.label}</button>)}
    </div>
    <SliderRow label="Intensidade do brilho" min={0} max={3} step={0.05}
      value={values.glazeStrength!} onChange={glazeStrength => onChange({ glazeStrength })} defaultValue={1} format={percent} />
    <SliderRow label="Nitidez do verniz" min={0} max={1} step={0.01}
      value={1 - values.clearcoatRoughness!} onChange={v => onChange({ clearcoatRoughness: 1 - v })} defaultValue={0.96} format={percent} />
    <SliderRow label="Camada de verniz" min={0} max={1} step={0.01}
      value={values.clearcoat} onChange={clearcoat => onChange({ clearcoat })} defaultValue={1} format={percent} />
    <SliderRow label="Polimento da cerâmica" min={0} max={1} step={0.01}
      value={1 - values.roughness} onChange={v => onChange({ roughness: Math.max(0.01, 1 - v) })} defaultValue={0.92} format={percent} />
    <SliderRow label="Reflexos do estúdio" min={0} max={3} step={0.05}
      value={values.reflection} onChange={reflection => onChange({ reflection })} defaultValue={0.8} format={percent} />
    <p>O brilho acompanha a luz e o giro, mantendo a cor da estampa. Corpo, alça e borda recebem o mesmo acabamento.</p>
    {onApplyAll && <button className="cg-apply-finish" type="button" onClick={() => onApplyAll(values)}>Aplicar acabamento a todas</button>}
  </fieldset>;
}
